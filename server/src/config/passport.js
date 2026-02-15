// server/src/config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config(); // Ensure env variables are loaded

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const serverUrl =
  process.env.SERVER_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 8000}`;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${serverUrl}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          const googlePicture = profile.photos?.[0]?.value || "";

          if (!user) {
            user = new User({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              picture: googlePicture,
              googlePicture,
            });
            await user.save();
          } else {
            const shouldSyncPicture =
              !user.picture || user.picture === user.googlePicture;
            user.googlePicture = googlePicture;
            if (shouldSyncPicture && googlePicture) user.picture = googlePicture;
            await user.updateLoginTime();
          }

          return done(null, user);
        } catch (err) {
          console.error("❌ Error in GoogleStrategy:", err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn(
    "⚠️ GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing: Google login routes will not work"
  );
}

// Store only user.id in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieve full user from DB by id
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error("❌ Error in deserializeUser:", err);
    done(err, null);
  }
});

export default passport;
