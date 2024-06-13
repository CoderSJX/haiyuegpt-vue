declare global {
    interface Window {
        imp?: any; // 如果你知道imp的确切类型，可以替换any为具体的类型定义
    }
}
export * from "./gpt";
