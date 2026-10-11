import ts from "typescript";
export default function transpilePhotoFixture(source) {
  return ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }, fileName: this.resourcePath }).outputText;
};
