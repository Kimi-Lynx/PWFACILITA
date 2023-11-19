"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const VSCode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const BOOT_UPGRADE = 'BOOT_UPGRADE';
const OTHER_REFACTORINGS = 'NON_BOOT_UPGRADE';
function getWorkspaceFolderName(file) {
    if (file) {
        const wf = VSCode.workspace.getWorkspaceFolder(file);
        if (wf) {
            return wf.name;
        }
    }
    return '';
}
function getRelativePathToWorkspaceFolder(file) {
    if (file) {
        const wf = VSCode.workspace.getWorkspaceFolder(file);
        if (wf) {
            return path.relative(wf.uri.fsPath, file.fsPath);
        }
    }
    return '';
}
function getTargetPomXml() {
    return __awaiter(this, void 0, void 0, function* () {
        if (VSCode.window.activeTextEditor) {
            const activeUri = VSCode.window.activeTextEditor.document.uri;
            if ("pom.xml" === path.basename(activeUri.path).toLowerCase()) {
                return activeUri;
            }
        }
        const candidates = yield VSCode.workspace.findFiles("**/pom.xml");
        if (candidates.length > 0) {
            if (candidates.length === 1) {
                return candidates[0];
            }
            else {
                return yield VSCode.window.showQuickPick(candidates.map((c) => ({ value: c, label: getRelativePathToWorkspaceFolder(c), description: getWorkspaceFolderName(c) })), { placeHolder: "Select the target project." }).then(res => res && res.value);
            }
        }
        return undefined;
    });
}
const ROOT_RECIPES_BUTTON = {
    iconPath: new VSCode.ThemeIcon('home'),
    tooltip: 'Root Recipes'
};
const SUB_RECIPES_BUTTON = {
    iconPath: new VSCode.ThemeIcon('type-hierarchy'),
    tooltip: 'Sub-Recipes'
};
function showRefactorings(uri, filter) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!uri) {
            uri = yield getTargetPomXml();
        }
        const choices = yield showCurrentPathQuickPick(VSCode.commands.executeCommand('sts/rewrite/list', uri.toString(true), filter).then((cmds) => cmds.map(convertToQuickPickItem)), []);
        const recipeDescriptors = choices.filter(i => i.selected).map(convertToRecipeDescriptor);
        if (recipeDescriptors.length) {
            const aggregateRecipeDescriptor = recipeDescriptors.length === 1 ? recipeDescriptors[0] : {
                name: `${recipeDescriptors.length} recipes`,
                displayName: `${recipeDescriptors.length} recipes`,
                description: recipeDescriptors.map(d => d.description).join('\n'),
                tags: [...new Set(recipeDescriptors.flatMap(d => d.tags))],
                languages: [...new Set(recipeDescriptors.flatMap(d => d.languages))],
                options: [],
                recipeList: recipeDescriptors,
                estimatedEffortPerOccurrence: recipeDescriptors.filter(d => d.estimatedEffortPerOccurrence).map(d => d.estimatedEffortPerOccurrence).reduce((p, c) => p + c, 0)
            };
            if (aggregateRecipeDescriptor.estimatedEffortPerOccurrence === 0) {
                delete aggregateRecipeDescriptor.estimatedEffortPerOccurrence;
            }
            VSCode.commands.executeCommand('sts/rewrite/execute', uri.toString(true), aggregateRecipeDescriptor);
        }
        else {
            VSCode.window.showErrorMessage('No Recipes were selected!');
        }
    });
}
function convertToRecipeDescriptor(i) {
    return Object.assign(Object.assign({}, i.recipeDescriptor), { recipeList: i.children.filter(c => c.selected).map(convertToRecipeDescriptor) });
}
function convertToQuickPickItem(i) {
    return {
        id: i.name,
        label: i.displayName,
        detail: i.options.filter(o => !!o.value).map(o => `${o.name}: ${JSON.stringify(o.value)}`).join('\n\n'),
        description: i.description,
        selected: false,
        children: i.recipeList ? i.recipeList.map(convertToQuickPickItem) : [],
        buttons: i.recipeList && i.recipeList.length ? [SUB_RECIPES_BUTTON] : undefined,
        recipeDescriptor: i
    };
}
function showCurrentPathQuickPick(itemsPromise, itemsPath) {
    const quickPick = VSCode.window.createQuickPick();
    quickPick.title = 'Loading Recipes...';
    quickPick.canSelectMany = true;
    quickPick.busy = true;
    quickPick.show();
    return itemsPromise.then(items => {
        return new Promise((resolve, reject) => {
            let currentItems = items;
            let parent;
            itemsPath.forEach(p => {
                parent = currentItems.find(i => i === p);
                currentItems = parent.children;
            });
            quickPick.items = currentItems;
            if (itemsPath.length) {
                quickPick.buttons = [ROOT_RECIPES_BUTTON];
            }
            quickPick.selectedItems = currentItems.filter(i => i.selected);
            quickPick.onDidTriggerItemButton(e => {
                if (e.button === SUB_RECIPES_BUTTON) {
                    currentItems.forEach(i => i.selected = quickPick.selectedItems.includes(i));
                    itemsPath.push(e.item);
                    showCurrentPathQuickPick(Promise.resolve(items), itemsPath).then(resolve, reject);
                }
            });
            quickPick.onDidTriggerButton(b => {
                if (b === ROOT_RECIPES_BUTTON) {
                    currentItems.forEach(i => i.selected = quickPick.selectedItems.includes(i));
                    itemsPath.splice(0, itemsPath.length);
                    showCurrentPathQuickPick(Promise.resolve(items), itemsPath).then(resolve, reject);
                }
            });
            quickPick.onDidAccept(() => {
                currentItems.forEach(i => i.selected = quickPick.selectedItems.includes(i));
                if (itemsPath.length) {
                    itemsPath.pop();
                    showCurrentPathQuickPick(Promise.resolve(items), itemsPath).then(resolve, reject);
                }
                else {
                    quickPick.hide();
                    resolve(items);
                }
            });
            quickPick.onDidChangeSelection(selected => {
                currentItems.forEach(i => {
                    const isSelectedItem = selected.includes(i);
                    if (i.selected !== isSelectedItem) {
                        selectItemRecursively(i, isSelectedItem);
                    }
                });
                updateParentSelection(itemsPath.slice());
            });
            quickPick.title = 'Select Recipes';
            quickPick.busy = false;
        });
    });
}
function updateParentSelection(hierarchy) {
    if (hierarchy.length) {
        const parent = hierarchy.pop();
        const isSelected = !!parent.children.find(i => i.selected);
        if (parent.selected !== isSelected) {
            parent.selected = isSelected;
            updateParentSelection(hierarchy);
        }
    }
}
function selectItemRecursively(i, isSelectedItem) {
    i.selected = isSelectedItem;
    if (i.children) {
        i.children.forEach(c => selectItemRecursively(c, isSelectedItem));
    }
}
/** Called when extension is activated */
function activate(client, options, context) {
    context.subscriptions.push(VSCode.commands.registerCommand('vscode-spring-boot.rewrite.list.boot-upgrades', param => {
        if (client.isRunning()) {
            return showRefactorings(param, BOOT_UPGRADE);
        }
        else {
            VSCode.window.showErrorMessage("No Spring Boot project found. Action is only available for Spring Boot Projects");
        }
    }), VSCode.commands.registerCommand('vscode-spring-boot.rewrite.list.refactorings', param => {
        if (client.isRunning()) {
            return showRefactorings(param, OTHER_REFACTORINGS);
        }
        else {
            VSCode.window.showErrorMessage("No Spring Boot project found. Action is only available for Spring Boot Projects");
        }
    }), VSCode.commands.registerCommand('vscode-spring-boot.rewrite.reload', () => {
        if (client.isRunning()) {
            return VSCode.commands.executeCommand('sts/rewrite/reload');
        }
        else {
            VSCode.window.showErrorMessage("No Spring Boot project found. Action is only available for Spring Boot Projects");
        }
    }));
}
exports.activate = activate;
//# sourceMappingURL=rewrite.js.map