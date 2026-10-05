const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { sequelize } = require('./models');

const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

start();
