require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });
require("./empty-server-only.cjs");
