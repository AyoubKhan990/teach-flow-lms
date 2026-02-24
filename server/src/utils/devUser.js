import User from "../models/User.js";

export async function getOrCreateDevUser() {
  const email = process.env.DEV_AUTH_EMAIL || "dev@local.test";
  const name = process.env.DEV_AUTH_NAME || "Dev User";
  const googleId = `dev:${email}`;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId,
        name,
        email,
        picture: "",
        googlePicture: "",
      });
    }
    return user;
  } catch {
    return {
      _id: "dev-user",
      id: "dev-user",
      googleId,
      name,
      email,
      picture: "",
      googlePicture: "",
      settings: { account: { status: "active" } },
      security: { passwordHash: "" },
    };
  }
}

