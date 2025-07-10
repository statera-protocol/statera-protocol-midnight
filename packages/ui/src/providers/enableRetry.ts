import type { Logger } from "pino";

type attempFnType = (
  retry: number,
  currentDelay: number,
  isRetry: boolean
) => void;

export const enableRetry = <T>(
  fnOpertion: () => Promise<T>,
  fnName: string,
  logger: Logger,
  retries: number = 10,
  delay: number = 500,
  maxDelay: number = 30000,
  backOffFactor: number = 1.2
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const attempt: attempFnType = (
      retry: number,
      currentDelay: number,
      isRetry: boolean
    ) => {
      fnOpertion()
        .then((result) => {
          if (isRetry) {
            logger.info(`[${fnName}] succeeded after retries`);
          }
          resolve(result);
        })
        .catch((error) => {
          logger.error(`[${fnName}] failed: ${error.message}`);

          if (retries <= 0) {
            logger.error(`[${fnName}] failed: ${error.message}`);
            reject(error);
          } else {
            logger.info(`[${fnName}] failed: Retrying in ${currentDelay}ms`);
            setTimeout(() => {
              const nextDelay = Math.min(
                currentDelay * backOffFactor,
                maxDelay
              );
              attempt(retry - 1, nextDelay, true);
            }, currentDelay);
          }
        });
    };

    attempt(retries, delay, false);
  });
};
