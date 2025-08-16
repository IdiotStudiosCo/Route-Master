# Route-Master
Lightweight API manager for Node.js: automatically loads routes from a folder, enables per-route configuration, and provides built-in logging and log cleanup.

---

## Features

* **Dynamic Route Loading**: Automatically loads JavaScript files from the `routes/` directory.
* **Config Management**: Enable or disable routes easily via the JSONC config file.
* **CORS Support**: Customize allowed origins and HTTP methods.
* **Logging System**: Supports `info`, `warn`, and `error` levels, with automatic log directory creation.
* **Log Cleanup**: Clear logs on start using config or CLI flag `--clear-logs`.
* **Graceful Shutdown**: Type `stop` in the terminal or use `Ctrl+C` / `kill` to cleanly exit and optionally clear logs.

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/IdiotStudiosCo/Route-Master.git
cd route-master
npm install
```

---

## Usage

### Start the API

```bash
npm start
```

### Clear Logs

```bash
npm start -- --clear-logs
```

Or via the npm script:

```bash
npm run clear-logs
```

---

## Configuration

Edit the `config.jsonc` file to customize your API:

```jsonc
{
  "info": {
    // The port the server will run on
    "port": 3000,
    // The Message that will be returned when the API is accessed at /
    "getmsg": "IdiotStudios API" // Should change this
  },
  // The Routes that will be enabled
  // If a route is not listed here, it will be made automatically
  "routes": {
    "config": true,
    "crafty": true,
    "message": true,
    "suggest": true
  },
  "cors": {
    "origin": "*",
    "methods": [
      "GET",
      "POST"
    ]
  },
  "logging": {
    // The level in which logs will be written
    // Options: "info", "warn", "error"
    // "info" will log all messages
    // "warn" will log warnings and errors
    // "error" will only log errors
    "level": "info",
    // The Directory where logs will be stored
    // If the directory does not exist, it will be created automatically
    "dir": "logs/",
    // Weather Logging is enabled
    // If false, no logs will be written
    "enabled": true,
    // Will clear logs on next server start
    // Note it will also stop the process after clearing
    "clearOnNextStart": false
  }
}
```

* **`info.port`** – Port your server will run on.
* **`info.getmsg`** – Message returned when accessing `/`.
* **`routes`** – Enable or disable route files. Routes not listed will be added automatically.
* **`cors`** – Configure allowed origins and HTTP methods.
* **`logging`** – Control log level, log directory, enable/disable logging, or clear logs on next start.

---

## Routes

Place your route files in the `routes/` folder. Example:

```js
// routes/example.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.send({ message: "Example route works!" });
});

export default router;
```

* Each route must export a default `router`.
* The loader mounts routes based on the file name: `/example` → `example.js`.

---

## Logging

* Logs are stored in the directory specified in `config.jsonc` (`logging.dir`).
* Logging levels:

  * `info` – logs all messages.
  * `warn` – logs warnings and errors.
  * `error` – logs only errors.

---

## Contributing

Pull requests are welcome!

* Follow the existing **route structure**.
* Keep logging conventions consistent.
* Ensure new routes are tested before submitting.

---

## License

