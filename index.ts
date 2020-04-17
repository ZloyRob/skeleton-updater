#!/usr/bin/env node

import path = require('path');
import fs = require('fs');
import execa = require('execa');
import inquirer = require('inquirer');
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

async function getAvailableSkeletonVersion(lastMergedSkeletonVersion: string): Promise<[] | null> {
  try {
    const {data} = await fetch(
      `https://api.github.com/repos/zloyrob/react-native-skeleton/releases`,
    );
    const availableVersions = data.reduce((versions: any, release: any) => {
      if (release.tag_name > lastMergedSkeletonVersion) {
        versions.push({version: release.tag_name, description: release.body.replace(/(?:\r\n -)/g, ';').replace(' - ', '')});
      }
      return versions;
    }, [])
    return availableVersions;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

async function getPatch(currentVersion: string, lastVersion: string): Promise<string | null> {
  let patch;
  const repoLink = `https://github.com/zloyrob/react-native-skeleton/compare/${currentVersion}...${lastVersion}`;
  console.info(`Getting diff between v${currentVersion} and v${lastVersion}`);
  console.info(`You can look compare by ${repoLink}`);
  try {
    const {data} = await fetch(
     repoLink + '.diff',
    );
    patch = data;
  } catch (error) {
    console.error(error.message);
    return null;
  }

  let patchWithRenamedProjects = patch;

  const {androidProjectName, iosProjectName} = await getNativeProjectNames();
  console.log(`Native project names ios - ${iosProjectName}, android - ${androidProjectName}`)
    // replace ios project name
    patchWithRenamedProjects = patchWithRenamedProjects.replace(
      new RegExp('ReactNativeSkeleton', 'g'),
      iosProjectName,
    );

    // replace android project name
    patchWithRenamedProjects = patchWithRenamedProjects
      .replace(new RegExp('com\\.reactnativeskeleton', 'g'), androidProjectName)
      .replace(
        new RegExp('com\\.reactnativeskeleton'.split('.').join('/'), 'g'),
        androidProjectName.split('.').join('/'),
      );

  return patchWithRenamedProjects;
}

async function applyPatch(tmpPatchFile: string): Promise<boolean> {
  const defaultExcludes = ['merge.sh', 'upgrade.ts'];
  let filesThatDontExist = [];
  let filesThatFailedToApply = [];
  try {
    try {
      await execa('git', ['remote', 'remove', 'skeleton_repo']);
      await execa('git', ['remote', 'add', 'skeleton_repo', 'git@github.com:ZloyRob/react-native-skeleton.git']);
      await execa('git', ['fetch', 'skeleton_repo']);
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
        '-C1',
        '--ignore-whitespace',
        '--3way',
      ]);
    } catch (error) {
      //console.log(error);
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
      console.log('files that don`t exist');
      console.log(filesThatDontExist);
      console.log('files that failed to apply');
      console.log(filesThatFailedToApply);
      await execa('git', ['apply', tmpPatchFile, ...excludes, '-p1', '-C1', '--ignore-whitespace', '--3way']);
    }
  } catch (error) {
    console.error(
      'Automatically applying diff failed. We did our best to automatically upgrade as many files as possible',
    );
    return false;
  }
  return true;
}

function asyncReadFile(path: string): Promise<string|null> {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, 'utf8', (err, result) => {
      if (err) {
          reject(null);
      }
      resolve(result)
    })
  })
}

async function getNativeProjectNames(): Promise<{androidProjectName: string, iosProjectName: string}> {
  let androidProjectName = null;
  const readAndroidResult = await asyncReadFile(path.join(process.cwd(), '/android/app/build.gradle'));
  if (readAndroidResult) {
    const regexpResult = readAndroidResult.match(/applicationId "(.*?)"|applicationId '(.*?)'/)
    console.log(`readFile ${regexpResult}`);
    if (regexpResult && regexpResult.length) {
      androidProjectName = regexpResult[1];
    }
  }

  if (!androidProjectName) {
    const questionsAndroid = [
      {
        type: 'input',
        name: 'value',
        validate: (input: string) => input.length > 0,
        message: 'Android Projects name (`com.wachanga.watertracker`)',
      },
    ];

    const androidProject: {value: string} = await inquirer.prompt(questionsAndroid);
    androidProjectName = androidProject.value;
  }

  let iosProjectName = null;
  const readIosResult = await asyncReadFile(path.join(process.cwd(), '/ios/Podfile'));
  if (readIosResult) {
    const regexpResult = readIosResult.match(/target '(.*?)'/);
    console.log(`readFile ${regexpResult}`);
    if (regexpResult && regexpResult.length) {
      iosProjectName = regexpResult[1];
    }
  }

  if (!iosProjectName) {
    const questionsIos = [
      {
        type: 'input',
        name: 'value',
        validate: (input: string) => input.length > 0,
        message: 'iOS Projects name (target `watertracker` in Podfile)',
      },
    ];

    const iosProject: {value: string} = await inquirer.prompt(questionsIos);
    iosProjectName = iosProject.value;
  }
  return {androidProjectName, iosProjectName};
}

/**
 * Upgrade application to a new version of React Native Skeleton.
 */
async function upgrade(): Promise<void> {

  const tmpPatchFile = 'tmp-upgrade-rn.patch';

  const packageJsonPath = path.join(process.cwd(), '/package.json');

  let packageJson = require(packageJsonPath);

  let lastMergedSkeletonVersion = packageJson.skeleton;

  if (!lastMergedSkeletonVersion) {
    console.log(
      'Could not find previous version of skeleton. \nPatch will include all versions starting from 0.0.1',
    );
    lastMergedSkeletonVersion = '0.0.1';
  }

  const availableSkeletonVersions = await getAvailableSkeletonVersion(lastMergedSkeletonVersion);

  if (!availableSkeletonVersions || availableSkeletonVersions.length === 0) {
    console.log('no update available');
    return;
  }

  const questionsVersion= [
    {
      type: 'list',
      name: 'value',
      choices: () => { return availableSkeletonVersions.map((item: any) => {
         return {name: `${item.version} (${item.description})`, value: item.version, short: item.version}
        }
      )},
      message: 'Select version to update',
    },
  ];

  const answerVersion: {value: string} = await inquirer.prompt(questionsVersion);
  const selectedVersion = answerVersion.value;
  const patch = await getPatch(lastMergedSkeletonVersion, selectedVersion);

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
    packageJson.skeleton = selectedVersion;
    fs.writeFileSync(path.join(process.cwd(), '/package.json'), JSON.stringify(packageJson));
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
