import {expect} from "chai";
import {DOMAIN_APPLICATION_MASK, DOMAIN_APPLICATION_BUILDER} from "../../src/index.js";

describe("validate application domains", async () => {
  [{name: "builder domain", domain: DOMAIN_APPLICATION_BUILDER}].map(({name, domain}) => {
    it(name, () => {
      let r = 0;
      for (let i = 0; i < DOMAIN_APPLICATION_MASK.length; i++) {
        r += DOMAIN_APPLICATION_MASK[i] & domain[i];
      }
      expect(r > 0).to.equal(true, `${name} mask application should be valid`);
    });
  });
});
