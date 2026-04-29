const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");

function createToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

function normalizeUsername(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "google_user";
}

async function generateUniqueUsername(baseUsername) {
  let candidate = normalizeUsername(baseUsername);
  let suffix = 1;

  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${normalizeUsername(baseUsername).slice(0, 20)}_${suffix}`;
    suffix += 1;
  }

  return candidate;
}

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, Email, and Password are required"});
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already exists"});
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role: "user",
        email,
      },
    });

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Username or Email already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
  
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and Password are required"});
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = createToken(user);

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
  
};

// GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google login is not configured on the server" });
    }

    const { data } = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
      params: { id_token: credential },
    });

    if (data.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ message: "Invalid Google audience" });
    }

    if (!data.email || data.email_verified !== "true") {
      return res.status(401).json({ message: "Google account email is not verified" });
    }

    let user = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (!user) {
      const baseUsername = data.email.split("@")[0] || data.name || "google_user";
      const username = await generateUniqueUsername(baseUsername);
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          username,
          email: data.email,
          password: hashedPassword,
          role: "user",
        },
      });
    }

    const token = createToken(user);
    res.json({ token });
  } catch (err) {
    const googleMessage = err.response?.data?.error_description;
    console.error("Google login error:", googleMessage || err.message || err);
    res.status(401).json({
      message: googleMessage || "Google login failed",
    });
  }
};

// CURRENT USER
exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
