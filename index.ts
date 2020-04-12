import path from 'path';
import fs from 'fs';
import execa from 'execa';
import inquirer from 'inquirer';
import nodeFetch, {RequestInit as FetchOptions, Response, Request, Headers} from 'node-fetch';

async function unwrapFetchResult(response: Response) {
  const data = await response.text();
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

async function fetch(
  url: string | Request,
  options?: FetchOptions,
): Promise<{status: number; data: any; headers: Headers}> {
  const result = await nodeFetch(url, options);
  const data = await unwrapFetchResult(result);

  if (result.status >= 400) {
    throw new Error(`Fetch request failed with status ${result.status}: ${data}.`);
  }

  return {
    status: result.status,
    headers: result.headers,
    data,
  };
}

async function getLastestSkeletonVersion(): Promise<string | null> {
  try {
    const {data} = await fetch(
      `https://api.github.com/repos/zloyrob/react-native-skeleton/releases/latest`,
    );
    return data.tag_name;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

async function getPatch(currentVersion: string, lastVersion: string): Promise<string | null> {
  let patch;

  console.info(`Getting diff between v${currentVersion} and v${lastVersion}`);

  try {
    const {data} = await fetch(
      `https://github.com/zloyrob/react-native-skeleton/compare/${currentVersion}...${lastVersion}.diff`,
    );
    //const {stdout} = await execa('git', ['diff', '--no-prefix', '-u', currentVersion, lastVersion]);
    patch = data; //stdout.length ? stdout + '\n' : '';
  } catch (error) {
    console.error(error.message);
    return null;
  }

  let patchWithRenamedProjects = patch;

  if (patchWithRenamedProjects !== '') {
    const questionsIos = [
      {
        type: 'input',
        name: 'value',
        validate: (input: string) => input.length > 0,
        message: 'iOS Projects name (target `watertracker` in Podfile)',
      },
    ];

    const iosProjectName: {value: string} = await inquirer.prompt(questionsIos);

    // replace ios project name
    patchWithRenamedProjects = patchWithRenamedProjects.replace(
      new RegExp('ReactNativeSkeleton', 'g'),
      iosProjectName.value,
    );

    const questionsAndroid = [
      {
        type: 'input',
        name: 'value',
        validate: (input: string) => input.length > 0,
        message: 'Android Projects name (`com.wachanga.watertracker`)',
      },
    ];

    const androidProjectName: {value: string} = await inquirer.prompt(questionsAndroid);

    // replace android project name
    patchWithRenamedProjects = patchWithRenamedProjects
      .replace(new RegExp('com\\.reactnativeskeleton', 'g'), androidProjectName.value)
      .replace(
        new RegExp('com\\.reactnativeskeleton'.split('.').join('/'), 'g'),
        androidProjectName.value.split('.').join('/'),
      );
  }

  return patchWithRenamedProjects;
}

async function applyPatch(tmpPatchFile: string): Promise<boolean> {
  const defaultExcludes = ['merge.sh', 'upgrade.ts'];
  let filesThatDontExist = [];
  let filesThatFailedToApply = [];
  try {
    try {
      const excludes = defaultExcludes.map(file => `--exclude=${file}`);
      await execa('git', [
        'apply',
        // According to git documentation, `--binary` flag is turned on by
        // default. However it's necessary when running `git apply --check` to
        // actually accept binary files, maybe a bug in git?
        '--binary',
        '--check',
        tmpPatchFile,
        ...excludes,
        '-p1',
        '--whitespace=fix',
        '--3way',
      ]);
    } catch (error) {
      console.log('first catch');
      const errorLines = error.stderr.split('\n');
      filesThatDontExist = [
        ...errorLines
          .filter((errorLine: string) => errorLine.includes('does not exist in index'))
          .map((errorLine: string) =>
            errorLine.replace(/^error: (.*): does not exist in index$/, '$1'),
          ),
      ].filter(Boolean);

      filesThatFailedToApply = errorLines
        .filter((errorLine: string) => errorLine.includes('patch does not apply'))
        .map((errorLine: string) => errorLine.replace(/^error: (.*): patch does not apply$/, '$1'))
        .filter(Boolean);
    } finally {
      console.info('Applying diff...');
      const excludes = [...defaultExcludes, ...filesThatDontExist, ...filesThatFailedToApply].map(
        file => `--exclude=${file}`,
      );
      await execa('git', ['apply', tmpPatchFile, ...excludes, '-p1', '--whitespace=fix', '--3way']);
    }
  } catch (error) {
    console.error(
      'Automatically applying diff failed. We did our best to automatically upgrade as many files as possible',
    );
    return false;
  }
  return true;
}

/**
 * Upgrade application to a new version of React Native Skeleton.
 */
async function upgrade(): Promise<void> {
  const tmpPatchFile = 'tmp-upgrade-rn.patch';

  // move from node_modules to root project dir
  process.chdir('../../');

  let {skeleton: lastMergedSkeletonVersion} = require(path.join(process.cwd(), '/package.json'));

  if (!lastMergedSkeletonVersion) {
    console.log(
      'Could not find previous version of skeleton. \nPatch will include all versions starting from 0.0.1',
    );
    lastMergedSkeletonVersion = '0.0.1';
  }

  const lastSkeletonVersion = await getLastestSkeletonVersion();

  if (!lastSkeletonVersion) {
    return;
  }

  const patch = await getPatch(lastMergedSkeletonVersion, lastSkeletonVersion);

  if (patch === null) {
    return;
  }

  if (patch === '') {
    console.log('Diff has no changes to apply');
    return;
  }
  let patchSuccess;

  try {
    fs.writeFileSync(tmpPatchFile, patch);
    patchSuccess = await applyPatch(tmpPatchFile);
  } catch (error) {
    throw new Error(error.stderr || error);
  } finally {
    try {
      fs.unlinkSync(tmpPatchFile);
    } catch (e) {
      // ignore
    }
    if (patchSuccess) {
      console.log('Upgrade was successful');
    } else {
      console.log('Upgrade finish. Needed resolve some conflicts');
    }
  }
}

upgrade();
