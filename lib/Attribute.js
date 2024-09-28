/** @internal */
export class Attribute {
    constructor(name, modelName, defaultValue, alwaysWriteJson) {
        this.name = name;
        this.alias = undefined;
        this.modelName = modelName;
        this.defaultValue = defaultValue;
        this.alwaysWriteJson = alwaysWriteJson;
        this.required = false;
        this.fixed = false;
        this.type = "any";
    }
    setType(value) {
        this.type = value;
        return this;
    }
    setAlias(value) {
        this.alias = value;
        return this;
    }
    setDescription(value) {
        this.description = value;
    }
    setRequired() {
        this.required = true;
        return this;
    }
    setFixed() {
        this.fixed = true;
        return this;
    }
    // sets modelAttr for nodes, and nodeAttr for model
    setpairedAttr(value) {
        this.pairedAttr = value;
    }
    setPairedType(value) {
        this.pairedType = value;
    }
}
Attribute.NUMBER = "number";
Attribute.STRING = "string";
Attribute.BOOLEAN = "boolean";
//# sourceMappingURL=Attribute.js.map