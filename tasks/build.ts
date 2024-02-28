import { build, UserConfig, UserConfigFn } from 'vite';
import fs from 'fs';
import viteConfig from '../vite.config';
import { program as argsUtil } from 'commander';
import Logger from '@aliser/logger';
const logger = new Logger('build-task');
const { logDebug, logInfo, logWarn, logError } = logger;

// CONFIGURATION
/** what paths to watch in watch mode */
const pathsToWatch = [
    'src/**',
    './*.ts'
]


// SCRIPT
const sourceFilePaths: string[] = [];
argsUtil
    .option('-w', 'watch mode')
    .argument('[source-file-paths...]', 'source file paths')
    .action((sourceFilePathsUntyped, options, command) => {
        if (!Array.isArray(sourceFilePathsUntyped))
            logError('values are not an array', sourceFilePathsUntyped, { throwErr: true });

        const result = sourceFilePathsUntyped as string[];
        logInfo(`given source file paths: \n${result.join(', ')}`,);
        if (result.length === 0) {
            logError('no source file paths specified', { throwErr: true });
        } else {
            sourceFilePaths.push(...result);
        }
    });

const argsUtilParsed = argsUtil.parse();
logInfo(`parsed source file paths: \n${sourceFilePaths.join(', ')}`,);

// check if builds paths do exist
const nonExistentPaths = sourceFilePaths.filter(filePath => !fs.existsSync(filePath));
if (nonExistentPaths.length > 0) {
    if (nonExistentPaths.length === 1) {
        logError(`build path does not exists: ${nonExistentPaths[0]}`, { throwErr: true });
    } else {
        logError(`build paths do not exist`, nonExistentPaths, { throwErr: true });
    }
}

const options = argsUtilParsed.opts();
const watchMode = options['w'];

const getViteConfig = (mode: string) => (viteConfig as UserConfigFn)({
    mode,
    command: 'build'
}) as UserConfig;

const loggersByPrefix: Record<string, Logger> = {}
async function runBuild(viteConfig: UserConfig, sourceFilePath: string, {
    watchMode = false
}) {
    const prefix = sourceFilePath;

    if (!loggersByPrefix[prefix])
        loggersByPrefix[prefix] = logger.cloneAndAppendPrefix(prefix);
    const loggerBySourceFilePath = loggersByPrefix[prefix];
    const { logDebug, logInfo, logWarn, logError } = loggerBySourceFilePath;

    if (watchMode) {
        logInfo('starting build in watch mode...');

        // if vite config build option is undefined, 
        // create an empty object to hold some values later
        if (!viteConfig.build)
            viteConfig.build = {}

        // enable watch mode
        viteConfig.build!.watch = {
            clearScreen: false,
            include: pathsToWatch
        }

        // here watcher is created
        // it will automatically rebuild every time a change occures in given paths
        // it will not resolve
        await build(viteConfig)
            .catch(err => logError('error', err, { throwErr: true }));
    } else {
        logInfo('starting build...');

        await build(viteConfig)
            .catch(err => logError('error', err, { throwErr: true }));

        logInfo('build done!');
    }
}

for (const buildMode of sourceFilePaths) {
    const viteConfig = getViteConfig(buildMode);

    await runBuild(viteConfig, buildMode, { watchMode });
}