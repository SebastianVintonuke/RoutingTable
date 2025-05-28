import TestCase from "./TestCase.js";

export default class TestCaseTest extends TestCase {
    test01AssertIsSuccessfulForTrue() {
        const aTest = new TestCase();
        aTest.assert(true);
    }

    test02AssertRaiseAnErrorForFalse() {
        const aTest = new TestCase();
        this.shouldRaise(()=>{aTest.assert(false)}, 'Assertion failed');
    }

    test03DenyIsSuccessfulForFalse() {
        const aTest = new TestCase();
        aTest.deny(false);
    }

    test04DenyRaiseAnErrorForTrue() {
        const aTest = new TestCase();
        this.shouldRaise(()=>{aTest.deny(true)}, 'Assertion failed');
    }

    test05AssertEqualsIsSuccessfulFor1And1() {
        const aTest = new TestCase();
        aTest.assertEquals(1, 1);
    }

    test06AssertEqualsRaiseAnErrorFor1And0() {
        const aTest = new TestCase();
        this.shouldRaise(()=>{ aTest.assertEquals(1, 0) }, 'Expected "0" but was "1"');
    }

    test07ShouldRaiseCatchsAnErrorAndTheMessageMatches() {
        this.shouldRaise(()=>{ throw new Error('Error expected') }, 'Error expected');
    }

    test08ShouldRaiseCatchsAnErrorAndTheMessageNotMatches() {
        this.shouldRaise(()=>{
            this.shouldRaise(()=>{ throw new Error('Error not expected') }, 'Error expected')
        }, `Expected error "Error expected" but was "Error not expected"`);
    }

    test09ShouldRaiseDontCatchsAnError() {
        this.shouldRaise(()=>{
            this.shouldRaise(()=>{}, 'Error')
        }, 'Assertion failed');
    }
}