#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var path = require("path");
var fs = require("fs");
var execa = require("execa");
var inquirer = require("inquirer");
var node_fetch_1 = require("node-fetch");
function unwrapFetchResult(response) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, response.text()];
                case 1:
                    data = _a.sent();
                    try {
                        return [2 /*return*/, JSON.parse(data)];
                    }
                    catch (e) {
                        return [2 /*return*/, data];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function fetch(url, options) {
    return __awaiter(this, void 0, void 0, function () {
        var result, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, node_fetch_1["default"](url, options)];
                case 1:
                    result = _a.sent();
                    return [4 /*yield*/, unwrapFetchResult(result)];
                case 2:
                    data = _a.sent();
                    if (result.status >= 400) {
                        throw new Error("Fetch request failed with status " + result.status + ": " + data + ".");
                    }
                    return [2 /*return*/, {
                            status: result.status,
                            headers: result.headers,
                            data: data
                        }];
            }
        });
    });
}
function getAvailableSkeletonVersion(lastMergedSkeletonVersion) {
    return __awaiter(this, void 0, void 0, function () {
        var data, availableVersions, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("https://api.github.com/repos/zloyrob/react-native-skeleton/releases")];
                case 1:
                    data = (_a.sent()).data;
                    availableVersions = data.reduce(function (versions, release) {
                        if (release.tag_name > lastMergedSkeletonVersion) {
                            versions.push({ version: release.tag_name, description: release.body.replace(/(?:\r\n -)/g, ';').replace(' - ', '') });
                        }
                        return versions;
                    }, []);
                    return [2 /*return*/, availableVersions];
                case 2:
                    error_1 = _a.sent();
                    console.error(error_1.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPatch(currentVersion, lastVersion) {
    return __awaiter(this, void 0, void 0, function () {
        var patch, data, error_2, patchWithRenamedProjects, _a, androidProjectName, iosProjectName;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.info("Getting diff between v" + currentVersion + " and v" + lastVersion);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("https://github.com/zloyrob/react-native-skeleton/compare/" + currentVersion + "..." + lastVersion + ".diff")];
                case 2:
                    data = (_b.sent()).data;
                    patch = data;
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _b.sent();
                    console.error(error_2.message);
                    return [2 /*return*/, null];
                case 4:
                    patchWithRenamedProjects = patch;
                    return [4 /*yield*/, getNativeProjectNames()];
                case 5:
                    _a = _b.sent(), androidProjectName = _a.androidProjectName, iosProjectName = _a.iosProjectName;
                    console.log("Native project names ios - " + iosProjectName + ", android - " + androidProjectName);
                    // replace ios project name
                    patchWithRenamedProjects = patchWithRenamedProjects.replace(new RegExp('ReactNativeSkeleton', 'g'), iosProjectName);
                    // replace android project name
                    patchWithRenamedProjects = patchWithRenamedProjects
                        .replace(new RegExp('com\\.reactnativeskeleton', 'g'), androidProjectName)
                        .replace(new RegExp('com\\.reactnativeskeleton'.split('.').join('/'), 'g'), androidProjectName.split('.').join('/'));
                    return [2 /*return*/, patchWithRenamedProjects];
            }
        });
    });
}
function applyPatch(tmpPatchFile) {
    return __awaiter(this, void 0, void 0, function () {
        var defaultExcludes, filesThatDontExist, filesThatFailedToApply, excludes, error_3, errorLines, excludes, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    defaultExcludes = ['merge.sh', 'upgrade.ts'];
                    filesThatDontExist = [];
                    filesThatFailedToApply = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, 5, 7]);
                    excludes = defaultExcludes.map(function (file) { return "--exclude=" + file; });
                    return [4 /*yield*/, execa('git', __spreadArrays([
                            'apply',
                            // According to git documentation, `--binary` flag is turned on by
                            // default. However it's necessary when running `git apply --check` to
                            // actually accept binary files, maybe a bug in git?
                            '--binary',
                            '--check',
                            tmpPatchFile
                        ], excludes, [
                            '-p1',
                            '--whitespace=fix',
                            '--3way',
                        ]))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 4:
                    error_3 = _a.sent();
                    console.log('first catch');
                    errorLines = error_3.stderr.split('\n');
                    filesThatDontExist = __spreadArrays(errorLines
                        .filter(function (errorLine) { return errorLine.includes('does not exist in index'); })
                        .map(function (errorLine) {
                        return errorLine.replace(/^error: (.*): does not exist in index$/, '$1');
                    })).filter(Boolean);
                    filesThatFailedToApply = errorLines
                        .filter(function (errorLine) { return errorLine.includes('patch does not apply'); })
                        .map(function (errorLine) { return errorLine.replace(/^error: (.*): patch does not apply$/, '$1'); })
                        .filter(Boolean);
                    return [3 /*break*/, 7];
                case 5:
                    console.info('Applying diff...');
                    excludes = __spreadArrays(defaultExcludes, filesThatDontExist, filesThatFailedToApply).map(function (file) { return "--exclude=" + file; });
                    console.log('exclude files');
                    console.log(excludes);
                    return [4 /*yield*/, execa('git', __spreadArrays(['apply', tmpPatchFile], excludes, ['-p1', '--whitespace=fix', '--3way']))];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_4 = _a.sent();
                    console.error('Automatically applying diff failed. We did our best to automatically upgrade as many files as possible');
                    return [2 /*return*/, false];
                case 9: return [2 /*return*/, true];
            }
        });
    });
}
function asyncReadFile(path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, result) {
            if (err) {
                reject(null);
            }
            resolve(result);
        });
    });
}
function getNativeProjectNames() {
    return __awaiter(this, void 0, void 0, function () {
        var androidProjectName, readAndroidResult, regexpResult, questionsAndroid, androidProject, iosProjectName, readIosResult, regexpResult, questionsIos, iosProject;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    androidProjectName = null;
                    return [4 /*yield*/, asyncReadFile(path.join(process.cwd(), '/android/app/build.gradle'))];
                case 1:
                    readAndroidResult = _a.sent();
                    if (readAndroidResult) {
                        regexpResult = readAndroidResult.match(/applicationId "(.*?)"|applicationId '(.*?)'/);
                        console.log("readFile " + regexpResult);
                        if (regexpResult && regexpResult.length) {
                            androidProjectName = regexpResult[1];
                        }
                    }
                    if (!!androidProjectName) return [3 /*break*/, 3];
                    questionsAndroid = [
                        {
                            type: 'input',
                            name: 'value',
                            validate: function (input) { return input.length > 0; },
                            message: 'Android Projects name (`com.wachanga.watertracker`)'
                        },
                    ];
                    return [4 /*yield*/, inquirer.prompt(questionsAndroid)];
                case 2:
                    androidProject = _a.sent();
                    androidProjectName = androidProject.value;
                    _a.label = 3;
                case 3:
                    iosProjectName = null;
                    return [4 /*yield*/, asyncReadFile(path.join(process.cwd(), '/ios/Podfile'))];
                case 4:
                    readIosResult = _a.sent();
                    if (readIosResult) {
                        regexpResult = readIosResult.match(/target '(.*?)'/);
                        console.log("readFile " + regexpResult);
                        if (regexpResult && regexpResult.length) {
                            iosProjectName = regexpResult[1];
                        }
                    }
                    if (!!iosProjectName) return [3 /*break*/, 6];
                    questionsIos = [
                        {
                            type: 'input',
                            name: 'value',
                            validate: function (input) { return input.length > 0; },
                            message: 'iOS Projects name (target `watertracker` in Podfile)'
                        },
                    ];
                    return [4 /*yield*/, inquirer.prompt(questionsIos)];
                case 5:
                    iosProject = _a.sent();
                    iosProjectName = iosProject.value;
                    _a.label = 6;
                case 6: return [2 /*return*/, { androidProjectName: androidProjectName, iosProjectName: iosProjectName }];
            }
        });
    });
}
/**
 * Upgrade application to a new version of React Native Skeleton.
 */
function upgrade() {
    return __awaiter(this, void 0, void 0, function () {
        var tmpPatchFile, packageJsonPath, packageJson, lastMergedSkeletonVersion, availableSkeletonVersions, questionsVersion, answerVersion, selectedVersion, patch, patchSuccess, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tmpPatchFile = 'tmp-upgrade-rn.patch';
                    packageJsonPath = path.join(process.cwd(), '/package.json');
                    packageJson = require(packageJsonPath);
                    lastMergedSkeletonVersion = packageJson.skeleton;
                    if (!lastMergedSkeletonVersion) {
                        console.log('Could not find previous version of skeleton. \nPatch will include all versions starting from 0.0.1');
                        lastMergedSkeletonVersion = '0.0.1';
                    }
                    return [4 /*yield*/, getAvailableSkeletonVersion(lastMergedSkeletonVersion)];
                case 1:
                    availableSkeletonVersions = _a.sent();
                    if (!availableSkeletonVersions || availableSkeletonVersions.length === 0) {
                        console.log('no update available');
                        return [2 /*return*/];
                    }
                    questionsVersion = [
                        {
                            type: 'list',
                            name: 'value',
                            choices: function () {
                                return availableSkeletonVersions.map(function (item) {
                                    return { name: item.version + " (" + item.description + ")", value: item.version, short: item.version };
                                });
                            },
                            message: 'Select version to update'
                        },
                    ];
                    return [4 /*yield*/, inquirer.prompt(questionsVersion)];
                case 2:
                    answerVersion = _a.sent();
                    selectedVersion = answerVersion.value;
                    return [4 /*yield*/, getPatch(lastMergedSkeletonVersion, selectedVersion)];
                case 3:
                    patch = _a.sent();
                    if (patch === null) {
                        return [2 /*return*/];
                    }
                    if (patch === '') {
                        console.log('Diff has no changes to apply');
                        return [2 /*return*/];
                    }
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, 7, 8]);
                    fs.writeFileSync(tmpPatchFile, patch);
                    return [4 /*yield*/, applyPatch(tmpPatchFile)];
                case 5:
                    patchSuccess = _a.sent();
                    packageJson.skeleton = selectedVersion;
                    fs.writeFileSync(path.join(process.cwd(), '/package.json'), JSON.stringify(packageJson));
                    return [3 /*break*/, 8];
                case 6:
                    error_5 = _a.sent();
                    throw new Error(error_5.stderr || error_5);
                case 7:
                    try {
                        fs.unlinkSync(tmpPatchFile);
                    }
                    catch (e) {
                        // ignore
                    }
                    if (patchSuccess) {
                        console.log('Upgrade was successful');
                    }
                    else {
                        console.log('Upgrade finish. Needed resolve some conflicts');
                    }
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
upgrade();
