import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
};

export const userPool = new CognitoUserPool(poolData);

export const loginAdmin = (email: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: resolve,
      onFailure: reject,
      newPasswordRequired: (userAttributes) => {
        resolve({ newPasswordRequired: true, user, userAttributes });
      },
    });
  });
};

export const logoutAdmin = () => {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
};

export const getToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: any, session: any) => {
      if (err) return resolve(null);
      resolve(session.getIdToken().getJwtToken());
    });
  });
};