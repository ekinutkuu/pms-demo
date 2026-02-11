About `db.ts`
Bu dosya `config` katmanında yer alır ve MongoDB/Mongoose bağlantı sorumluluğunu üstlenir. Uygulamanın yaşam döngüsü boyunca tekil ve tekrar kullanılabilir bir Mongoose bağlantısı sağlamayı hedefler. Bağlantı kurulamazsa, uygulamayı fail-fast prensibiyle sonlandırarak hatalı/eksik altyapı üzerinde servis vermeyi engeller.

About `connectToDatabase()`
*   **Purpose**: Establishes a connection to the MongoDB instance defined in `env.mongoUri`.
*   **Returns**: A Promise that resolves to the Mongoose instance.
*   **Behavior**:
    *   Checks if a connection already exists to avoid duplicate connections.
    *   Uses `mongoose.connect` with `serverSelectionTimeoutMS: 5000` to fail fast if the database is unreachable.
    *   Logs successful connection using the application logger.
    *   Sets up event listeners for `error` and `disconnected` events on the connection to log runtime issues.
    *   **Critical**: If the initial connection fails, it terminates the process with `process.exit(1)`.
*   **Env Variables**:
    *   `MONGO_URI`: Required. The connection string for MongoDB.
    *   `NODE_ENV`: Used to determine if `autoIndex` should be enabled (disabled in production).

