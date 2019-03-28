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

const changeToClass = (node, state) => {
    let programBody = new Array();
    node.body.forEach(varDeclarator => {
        varDeclarator.declarations.forEach(element => {
            let newClazz = {
                type: "ClassDeclaration",
                id: element.id
            };
            // newClazz.id = lang.obj.merge(element.id, { name: state.name });
    
            let body = {
                type: "ClassBody",
                body: []
            };

            newClazz.body = body;

            let constructorDef = {
                type: "MethodDefinition",
                kind: "constructor",
                key: { type: "Identifier", name: "constructor" },
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
                        body: []
                    }
                }
            }
            
            body.body.push(constructorDef);

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
                    constructorDef.value.body.body.push(superCallExp);
                    let superClazzName = property.value.value;
                    let superClazzPath = "./";
                    let importDeclaration = {
                        type: "VariableDeclaration",
                        kind: "var",
                        declarations: [
                            {
                                type: "VariableDeclarator",
                                id: {
                                    type: "Identifier",
                                    name: superClazzName
                                },
                                init: {
                                    type: "CallExpression",
                                    arguments: [
                                        {
                                            type: "Literal",
                                            raw: `"${superClazzPath}${superClazzName}.ts"`,
                                            value: `${superClazzPath}${superClazzName}.ts`
                                        }
                                    ],
                                    callee: { type: "Identifier", name: "require" }
                                }
                            }
                        ]
                    }
                    programBody.push(importDeclaration);
                    newClazz.superClass = { type: "Identifier", name: superClazzName }
                }
                if(property.key.name === "$members") {
                    property.value.properties.forEach(prop =>{
                        if(prop.value.type === 'FunctionExpression') {
                            let method = new Object();
                            method.type = "MethodDefinition";
                            method.key = prop.key;
                            method.kind = "method";
                            method.value = prop.value;
                            body.body.push(method);
                        } else {
                            let initAttr = {
                                type: "ExpressionStatement",
                                expression: {
                                    type: "AssignmentExpression",
                                    operator: "=",
                                    left: {
                                        type: "MemberExpression",
                                        object: {
                                            type: "ThisExpression"
                                        },
                                        property: prop.key
                                    },
                                    right: prop.value
                                }
                            }
                            constructorDef.value.body.body.push(initAttr);
                        }
                    });
                }
            });

            programBody.push(newClazz);

            let exportExpression = {
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    left: {
                        type: "MemberExpression",
                        object: { type: "Identifier", name: "module" },
                        property: { type: "Identifier", name: "exports" }
                    },
                    right: element.id,
                    operator: "="
                }
            }
            programBody.push(exportExpression);
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

let moduleName = 'BlastOfTheUniverse';
var fileName = `${moduleName}.js`;
// var fileName = 'class.dat';

fs.readFile(fileName, 'utf8', (err, content) => {
    if(err) {
        console.error(err);
        throw err;
    }
    var srcFolder = 'src'
    var parsed = ast.parse(content);
    var rewritten = visitor.accept(parsed, {name: moduleName}, []);

    // console.log(ast.stringify(rewritten));

    let tsFileName = `${srcFolder}/${moduleName}.ts`
    fs.appendFile(tsFileName, ast.stringify(rewritten), (error) => {
        if(error) {
            console.err(error);
        }
    });
});