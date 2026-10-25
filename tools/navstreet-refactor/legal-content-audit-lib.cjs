'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function normalizedAssembly(ts,file,source,read=filename=>fs.readFileSync(filename,'utf8')) {
 const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true),bindings=new Map();
 for(const stmt of sf.statements) if(ts.isImportDeclaration(stmt)&&stmt.moduleSpecifier.text.includes('/legal-content/')) {
   if(!stmt.importClause?.namedBindings||!ts.isNamedImports(stmt.importClause.namedBindings))throw Error('Content imports must be explicit named version bindings');
   const target=path.resolve(path.dirname(file),stmt.moduleSpecifier.text+'.ts');
   const catalogSource=read(target),catalogTree=ts.createSourceFile(target,catalogSource,ts.ScriptTarget.Latest,true);let values;
   function inspect(n){if(ts.isVariableDeclaration(n)&&n.name.getText(catalogTree).startsWith('SECTION_LEGAL_CONTENT_')&&!n.name.getText(catalogTree).includes('REVISION')){let i=n.initializer;if(ts.isCallExpression(i)&&i.expression.getText(catalogTree)==='Object.freeze')i=i.arguments[0];if(ts.isAsExpression(i))i=i.expression;if(!ts.isObjectLiteralExpression(i))throw Error('Versioned content must remain a literal catalog');values=Object.fromEntries(i.properties.map(p=>{if(!ts.isPropertyAssignment(p)||!ts.isStringLiteralLike(p.initializer))throw Error('Content entries must be literal strings');return[p.name.text,p.initializer.text]}));}ts.forEachChild(n,inspect)}inspect(catalogTree);
   if(!values)throw Error('No versioned content in '+target);
   for(const spec of stmt.importClause.namedBindings.elements){if(!spec.name.text.startsWith('SECTION_LEGAL_CONTENT_')||spec.name.text.includes('REVISION'))throw Error('Unsupported section content import');bindings.set(spec.name.text,values);}
 }
 const transformed=ts.transform(sf,[ctx=>{
  const visit=node=>{
   if(ts.isImportDeclaration(node)&&node.moduleSpecifier.text.includes('/legal-content/'))return undefined;
   if(ts.isElementAccessExpression(node)&&ts.isIdentifier(node.expression)&&bindings.has(node.expression.text)){
     if(!ts.isStringLiteralLike(node.argumentExpression))throw Error('Legal content references must use literal versioned keys');
     const values=bindings.get(node.expression.text),key=node.argumentExpression.text;if(!(key in values))throw Error('Unknown versioned content key '+key);return ts.factory.createStringLiteral(values[key]);
   }
   if(ts.isStringLiteralLike(node)&&!ts.isNoSubstitutionTemplateLiteral(node))return ts.factory.createStringLiteral(node.text);
   return ts.visitEachChild(node,visit,ctx);
  };return node=>ts.visitNode(node,visit);
 }]);
 const text=ts.createPrinter({removeComments:true}).printFile(transformed.transformed[0]);transformed.dispose();
 return ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,removeComments:true}}).outputText;
}
module.exports={hash,normalizedAssembly};
