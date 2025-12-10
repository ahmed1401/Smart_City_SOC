import { config } from 'dotenv';

import { createApp } from './app.js';

config();

const app = createApp();
const port = Number(process.env.PORT ?? 7000);
app.listen(port, () => {

  console.log(`SmartFlow orchestrator listening on port ${port}`);
});
