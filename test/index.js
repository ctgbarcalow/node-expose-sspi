const { sso, sspi } = require('node-expose-sspi');

const result = sspi.hello();
console.log('result: ', result);
const securityPackages = sspi.EnumerateSecurityPackages();
console.log(securityPackages);
const packageInfo = sspi.QuerySecurityPackageInfo('Negotiate');
console.log('packageInfo: ', packageInfo);

const clientCred = sspi.AcquireCredentialsHandle({
  packageName: 'Negotiate',
  authData: {
    domain: 'CHOUCHOU',
    user: 'jlouis',
    password: 'toto',
  },
  credentialUse: 'SECPKG_CRED_OUTBOUND',
});
console.log('clientCred: ', clientCred);
const serverCred = sspi.AcquireCredentialsHandle({
  packageName: 'Negotiate',
  credentialUse: 'SECPKG_CRED_INBOUND',
});
console.log('serverCred: ', serverCred);
const input = {
  credential: clientCred.credential,
  targetName: 'kiki',
  cbMaxToken: packageInfo.cbMaxToken,
  targetDataRep: 'SECURITY_NATIVE_DREP',
};
console.log('input: ', input);
const clientSecurityContext = sspi.InitializeSecurityContext(input);
console.log('clientSecurityContext: ', clientSecurityContext);
console.log(sso.hexDump(clientSecurityContext.SecBufferDesc.buffers[0]));
const serverSecurityContext = sspi.AcceptSecurityContext({
  credential: serverCred.credential,
  clientSecurityContext,
  contextReq: ['ASC_REQ_CONNECTION'],
  targetDataRep: 'SECURITY_NATIVE_DREP',
});
console.log('serverSecurityContext: ', serverSecurityContext);
console.log(sso.hexDump(serverSecurityContext.SecBufferDesc.buffers[0]));
const input2 = {
  credential: clientCred.credential,
  targetName: 'kiki',
  cbMaxToken: packageInfo.cbMaxToken,
  serverSecurityContext,
  contextHandle: clientSecurityContext.contextHandle,
};
console.log('input2: ', input2);
const clientSecurityContext2 = sspi.InitializeSecurityContext(input2);
console.log('clientSecurityContext2: ', clientSecurityContext2);
console.log(sso.hexDump(clientSecurityContext2.SecBufferDesc.buffers[0]));

const serverSecurityContext2 = sspi.AcceptSecurityContext({
  credential: serverCred.credential,
  clientSecurityContext: clientSecurityContext2,
  contextHandle: serverSecurityContext.contextHandle,
});
console.log('serverSecurityContext2: ', serverSecurityContext2);
console.log(sso.hexDump(serverSecurityContext2.SecBufferDesc.buffers[0]));

sspi.FreeCredentialsHandle(clientCred.credential);
console.log('free client credentials ok');

// security context ok

sspi.ImpersonateSecurityContext(serverSecurityContext.contextHandle);
console.log('impersonate security context ok');
const username = sspi.GetUserName();
console.log('username: ', username);

try {
  const displayName = sspi.GetUserNameEx('NameDisplay');
  console.log('displayName: ', displayName);
} catch (e) {
  console.log('this account does not seems to have a Display Name');
}

const NameSamCompatible = sspi.GetUserNameEx('NameSamCompatible');
console.log('NameSamCompatible: ', NameSamCompatible);
try {
  const NameDnsDomain = sspi.GetUserNameEx('NameDnsDomain');
  console.log('NameDnsDomain: ', NameDnsDomain);
} catch (e) {
  console.log('error for fun... no worries: ', e);
}

const userToken = sspi.OpenThreadToken(['TOKEN_QUERY', 'TOKEN_QUERY_SOURCE']);
console.log('userToken: ', userToken);

sspi.RevertSecurityContext(serverSecurityContext.contextHandle);
console.log('revert security context ok');

const userGroups = sspi.GetTokenInformation(userToken, 'TokenGroups');
console.log('userGroups: ', userGroups);

sspi.CloseHandle(userToken);
console.log('CloseHandle ok');

const sidObject = sspi.LookupAccountName(username);
console.log('sidObject: ', sidObject);

const username2 = sspi.GetUserName();
console.log('username2: ', username2);

const attributes = sspi.QueryCredentialsAttributes(
  serverCred.credential,
  'SECPKG_CRED_ATTR_NAMES'
);
console.log('attributes: ', attributes);

const names = sspi.QueryContextAttributes(
  serverSecurityContext.contextHandle,
  'SECPKG_ATTR_NAMES'
);
console.log('names: ', names);

const accessToken = sspi.QuerySecurityContextToken(
  serverSecurityContext.contextHandle
);
console.log('accessToken: ', accessToken);

const groups = sspi.GetTokenInformation(accessToken, 'TokenGroups');
console.log('groups: ', groups);

sspi.CloseHandle(accessToken);
console.log('CloseHandle ok');

sspi.DeleteSecurityContext(serverSecurityContext.contextHandle);
console.log('DeleteSecurityContext ok');
sspi.DeleteSecurityContext(clientSecurityContext.contextHandle);
console.log('DeleteSecurityContext ok');

sspi.FreeCredentialsHandle(serverCred.credential);
console.log('free server credentials ok');

// Test Active Directory
sspi.CoInitialize();
try {
  // const iads = sspi.ADsGestObject('WinNT://jlg.local/jlouis,user');
  const iads = sspi.ADsGestObject('LDAP://CN=Jean-Louis P. GUÉNÉGO,OU=JLG_LOCAL,DC=jlg,DC=local');
  const str = iads.get_Name();
  console.log('str: ', str);
  iads.Release();
} catch (error) {
  console.log('error: ', error);
}

sspi.CoUninitialize();
