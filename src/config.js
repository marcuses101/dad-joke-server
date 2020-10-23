module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  G_API_KEY:
    process.env.NODE_ENV === "development"
      ? process.env.G_API_KEY_DEV
      : process.env.G_API_KEY_PROD,
  AZURE_KEY: process.env.AZURE_KEY,
  DAD_API: process.env.DAD_API
};
