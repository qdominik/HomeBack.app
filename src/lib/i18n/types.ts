export type Dictionary = {
  app: {
    name: string;
    tagline: string;
  };
  navigation: {
    dashboard: string;
    items: string;
    home: string;
    family: string;
    documents: string;
    categories: string;
    settings: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    householdSetupTitle: string;
    householdSetupDescription: string;
    checkEmailTitle: string;
    checkEmailDescription: string;
    email: string;
    password: string;
    passwordHint: string;
    name: string;
    householdName: string;
    householdType: string;
    householdTypes: {
      house: string;
      apartment: string;
      garage: string;
    };
    signIn: string;
    createAccount: string;
    createHousehold: string;
    signOut: string;
    backToLogin: string;
    signedInAs: string;
    roles: {
      admin: string;
      member: string;
      child: string;
      guest: string;
    };
    errors: {
      confirmationFailed: string;
      householdFailed: string;
      invalidCredentials: string;
      missingFields: string;
      passwordTooShort: string;
      sessionExpired: string;
      signupFailed: string;
      unknown: string;
    };
  };
  dashboard: {
    title: string;
    greeting: string;
    addItem: string;
    recentItems: string;
    expiringItems: string;
    categoryCount: string;
    activity: string;
    empty: string;
  };
  modules: {
    items: {
      title: string;
      search: string;
      category: string;
      room: string;
      empty: string;
    };
    home: {
      title: string;
      rooms: string;
      locations: string;
      empty: string;
    };
    family: {
      title: string;
      members: string;
      invite: string;
      empty: string;
    };
    documents: {
      title: string;
      upload: string;
      empty: string;
    };
    categories: {
      title: string;
      system: string;
      custom: string;
      empty: string;
    };
    settings: {
      title: string;
      household: string;
      account: string;
      export: string;
    };
  };
};
