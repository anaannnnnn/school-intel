// Installs the seed as the school database for every test file, with one cheap passcode for all logins.
import { createSeedWithAccounts } from './seed';
import { hashPasscode } from './passcode';
import { installDatabase } from './store';

export const TEST_PASSCODE = 'test-passcode';

const { doc, accounts } = createSeedWithAccounts();
const passwordHash = hashPasscode(TEST_PASSCODE, '0123456789abcdef0123456789abcdef');
installDatabase(doc, accounts.map((a) => ({ ...a, passwordHash })));
