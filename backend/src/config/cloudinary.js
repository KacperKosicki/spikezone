const { v2: cloudinary } = require("cloudinary");

const ready =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (ready) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn("⚠️ Cloudinary: brak zmiennych w .env (CLOUDINARY_*)");
}

module.exports = { cloudinary, cloudinaryReady: ready };
