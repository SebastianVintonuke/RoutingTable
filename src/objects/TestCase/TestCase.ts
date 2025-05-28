export default class TestCase {
    setUp() {}

    assert(aBooleanOrBlock) {
        if (typeof aBooleanOrBlock === 'boolean') {
            if (!aBooleanOrBlock) {
                throw new Error('Assertion failed');
            } else {
                return true
            }
        } else {
            if (!aBooleanOrBlock()) {
                throw new Error('Assertion failed');
            } else {
                return true
            }
        }
    }

    deny(aBoolean) {
        return this.assert(!aBoolean);
    }

    assertEquals(actual, expected) {
        if (actual && typeof actual.equals === 'function') {
            if (!actual.equals(expected)) {
                throw new Error(`Expected "${expected}" but was "${actual}"`);
            }
        } else {
            if (actual != expected) {
                throw new Error(`Expected "${expected}" but was "${actual}"`);
            }
        }
        return true
    }

    shouldRaise(aBlock, anExceptionMessage) {
        try {
            aBlock()
        } catch (error) {
            if (error.message == anExceptionMessage) {
                return true
            } else {
                throw new Error(`Expected error "${anExceptionMessage}" but was "${error.message}"`);
            }
        }
        throw new Error('Assertion failed');
    }

    runTests() {
        console.log(this.constructor.name);
        const messages = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        let run = 0;
        let passed = 0;
        let failed = 0;
        let errors = 0;
        for (const message of messages) {
            const method = this[message];
            if (typeof method === 'function' && message.startsWith('test')) {
                run++;
                try {
                    this.setUp();
                    method.call(this);
                    passed++;
                    console.log(`Test '${message}' ${this.formatTextInGreen('passed')}.`);
                } catch (error) {
                    if (this.isATestingError(error)) {
                        failed++;
                        console.error(`Test '${message}' ${this.formatTextInYellow('failed')}:`, error);
                    } else {
                        errors++;
                        console.error(`Test '${message}' ${this.formatTextInRed('error')}:`, error);
                    }
                }
            }
        }
        console.log(`${run} run, ${this.formatTextInGreen(`${passed} passed`)}, ${this.formatTextInYellow(`${failed} failed`)}, ${this.formatTextInRed(`${errors} error`)}`);
    }

    isATestingError(error) {
        // Should refactor and use regexs
        return error.message === 'Assertion failed' ||
            error.message.includes('Expected "') && error.message.includes(" but was ") ||
            error.message.includes('Expected error "') && error.message.includes(" but was ")
    }

    formatTextInGreen(text) {
        return `\x1b[32m${text}\x1b[0m`;
    }

    formatTextInYellow(text) {
        return `\x1b[33m${text}\x1b[0m`;
    }

    formatTextInRed(text) {
        return `\x1b[31m${text}\x1b[0m`;
    }
}