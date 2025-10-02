import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { getPool } from "./db";
import { getStorage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import {
  createSupabaseUser,
  sanitizeUser,
  signInWithSupabase,
  type SafeUser,
} from "./supabaseAuthService";

declare global {
  namespace Express {
    interface User extends SafeUser {}
  }
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  const MemoryStore = createMemoryStore(session);
  const pool = getPool();
  const storage = getStorage();
  const usePgStore = Boolean(pool);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "crawlguard-session-secret-key",
    resave: false,
    saveUninitialized: false,
    store:
      usePgStore && pool
        ? new PostgresSessionStore({
            pool,
            createTableIfMissing: true,
          })
        : new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const { localUser } = await signInWithSupabase(email.trim().toLowerCase(), password);
        const safeUser = sanitizeUser(localUser);
        return done(null, safeUser);
      } catch (error: any) {
        const message = error?.message || "Invalid email or password";
        return done(null, false, { message });
      }
    })
  );

  passport.serializeUser((user: SafeUser, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      const safeUser = sanitizeUser(user);
      done(null, safeUser);
    } catch (error) {
      done(error as Error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const normalizedEmail = validatedData.email.trim().toLowerCase();

      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const { localUser } = await createSupabaseUser(
        normalizedEmail,
        validatedData.password,
        validatedData.username
      );

      const safeUser = sanitizeUser(localUser);

      req.login(safeUser, (err) => {
        if (err) return next(err);
        res.status(201).json(safeUser);
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid registration data" });
      }
      res.status(400).json({ error: error?.message || "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SafeUser, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const user = req.user!;
    res.json(user);
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map((user) => sanitizeUser(user));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      if (id === currentUser.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
}
