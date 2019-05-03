// var {Visitor} = require('./visitor'),
var {Visitor} = require('./es6visitor'),
    lang = require("lively.lang"),
    ast = require("lively.ast"),
    fs = require("fs");

const variableDeclaratorReplacer = (node, state) => {
    state.push(node.id.name);
    return lang.obj.merge(node, {id: {type: "Identifier", name: "foo_" + node.id.name}});
};

const identifierReplacer = (node, state) => {
    if(state.find((element) => element === node.name)) {
        return lang.obj.merge(node, {name: "foo_" + node.name });
    }
    return node;
}

var nodeLogger = (node) => {
    console.log("Printing: " + node.type);
    console.log(node);
    return node;
};

const identifier = (name) => {return { type: "Identifier", name: name }};

const changeToClass = (node, state) => {
    let programBody = new Array();
    node.body.forEach(varDeclarator => {
        varDeclarator.declarations.forEach(element => {
    
            let clazzName = element.id;

            let classBody = [];

            let newClazz = {
                type: "ClassDeclaration",
                id: clazzName,
                body: {
                    type: "ClassBody",
                    body: classBody
                }
            };

            let exportDefaultDeclaration = {
                type: "ExportDefaultDeclaration",
                declaration: newClazz
            };

            let constructorBody = new Array();

            let constructorDef = {
                type: "MethodDefinition",
                kind: "constructor",
                key: identifier("constructor"),
                static: false,
                computed: false,
                value: {
                    type: "FunctionExpression",
                    async: false,
                    expression: false,
                    generator: false,
                    id: null,
                    params: [], // Aqui vao os Identifiers dos params
                    body: {
                        type: "BlockStatement",
                        body: constructorBody
                    }
                }
            }
            
            classBody.push(constructorDef);

            let expInit = null;

            element.init.properties.forEach(property => {
                if(property.key.name === "$extends") {
                    let superCallExp = {
                        type: "ExpressionStatement",
                        expression: {
                            type: "CallExpression",
                            arguments: [],
                            callee: { type: "Super" }
                        }
                    };
                    constructorBody.push(superCallExp);
                    let superClazzName = property.value.value;
                    let superClazzPath = "./";

                    let importDeclaration = {
                        type: "ImportDeclaration",
                        source: { 
                            type: "Literal",
                            raw: `"${superClazzPath}${superClazzName}"`,
                            value: `${superClazzPath}${superClazzName}`
                        },
                        specifiers: [
                            {
                                type: "ImportDefaultSpecifier",
                                local: { type: "Identifier", name: superClazzName }
                            }
                        ]
                    };

                    programBody.push(importDeclaration);

                    newClazz.superClass = { type: "Identifier", name: superClazzName }
                }

                if(property.key.name === "$static") {
                    property.value.properties.forEach(prop =>{
                        if(prop.value.type === 'FunctionExpression') {
                            let methodIdentifier = (prop.key.name === "_init_") ? identifier("initialize") : prop.key;
                            let method = {
                                type: "MethodDefinition",
                                key: methodIdentifier,
                                kind: "method",
                                value: prop.value,
                                static: true
                            };

                            expInit = (prop.key.name === "_init_") ? {
                                type: "ExpressionStatement",
                                expression: {
                                    type: "CallExpression",
                                    arguments: [],
                                    callee: {
                                        type: "MemberExpression",
                                        object: identifier(clazzName.name),
                                        property: identifier("initialize")
                                    }
                                }
                            } : null;
                            
                            classBody.push(method);
                        } else {
                            let initAttr = {
                                type: "ExpressionStatement",
                                expression: {
                                    type: "AssignmentExpression",
                                    operator: "=",
                                    left: prop.key,
                                    right: prop.value
                                }
                            }
                            classBody.push(initAttr);
                        }
                    });
                }

                if(property.key.name === "$members") {
                    property.value.properties.forEach(prop =>{
                        if(prop.value.type === 'FunctionExpression') {
                            let method = {
                                type: "MethodDefinition",
                                key: prop.key,
                                kind: "method",
                                value: prop.value
                            };
                            
                            classBody.push(method);
                        } else {
                            // let initAttr = {
                            //     type: "ExpressionStatement",
                            //     expression: {
                            //         type: "AssignmentExpression",
                            //         operator: "=",
                            //         left: {
                            //             type: "MemberExpression",
                            //             object: {
                            //                 type: "ThisExpression"
                            //             },
                            //             property: prop.key
                            //         },
                            //         right: prop.value
                            //     }
                            // }
                            // constructorBody.push(initAttr);
                            // classBody.push(prop.key);
                            classBody.push({
                                type: "ExpressionStatement",
                                expression: {
                                    type: "AssignmentExpression",
                                    operator: "=",
                                    left: prop.key,
                                    right: prop.value
                                },
                            });
                        }
                    });
                }
            });

            programBody.push(exportDefaultDeclaration);
            if(expInit !== null) {
                programBody.push(expInit);
            }
        });
    });
    return lang.obj.merge(node, {body: programBody});
};

var visitor = new Visitor();

visitor.accept = lang.fun.wrap(visitor.accept, (proceed, node, state, path) => {
    if(node.type === 'Program') node = changeToClass(node, state);

    // nodeLogger(node);

    // if (node.type === "VariableDeclarator") node = variableDeclaratorReplacer(node, newState);
    // if (node.type === "Identifier") {
    //     node = identifierReplacer(node, newState);
    // }
    // return proceed(node, state, path);
    return node;
});

const baseSourceDirectory = "js";
const baseTargetDirectory = "src";

const createTargetDirectory = (path) => {
    fs.mkdirSync(`${baseTargetDirectory}/${path.join("/")}`, {recursive: false});
};

const convertingToTs = (path, moduleName) => {
    let jsFileName = `${baseSourceDirectory}/${path.join("/")}/${moduleName}.js`;
    fs.readFile(jsFileName, 'utf8', (err, content) => {
        if(err) {
            console.error(err);
            throw err;
        }
        let parsed = ast.parse(content);
        let rewritten = visitor.accept(parsed, {name: moduleName}, []);
    
        // console.log(ast.stringify(rewritten));
    
        let tsFileName = `${baseTargetDirectory}/${path.join("/")}/${moduleName}.ts`
        fs.appendFile(tsFileName, ast.stringify(rewritten), (error) => {
            if(error) {
                console.err(error);
            }
        });
    });
};

const walkDirectory = (path) => {
    let baseFolder = `${baseSourceDirectory}/${path.join("/")}`;
    fs.readdir(baseFolder, {"withFileTypes": true}, (err, files) => {
        if(err) {
            console.log(err);
            throw err;
        }
        files.forEach((file) => {
            if(file.isDirectory()) {
                path.push(file.name);
                createTargetDirectory(path);
                walkDirectory(path);
            } else {
                if(file.name.endsWith(".js")) {
                    console.log(`Shit! Converting ${file.name} to TypeScript!!!!`);
                    let moduleName = file.name.replace(".js", "");
                    convertingToTs(path, moduleName);
                }
            }
        });
    });
};

walkDirectory(new Array());
