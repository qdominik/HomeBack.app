export type Dictionary = {
  app: {
    name: string;
    tagline: string;
  };
  navigation: {
    main: string;
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
      emailAlreadyRegistered: string;
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
      addItem: string;
      createItem: string;
      editItem: string;
      archiveItem: string;
      saveChanges: string;
      saving: string;
      archiving: string;
      loading: string;
      readOnly: string;
      name: string;
      description: string;
      itemType: string;
      quantity: string;
      selectCategory: string;
      selectRoom: string;
      selectStorage: string;
      selectPosition: string;
      locationHelp: string;
      categoryUnavailable: string;
      systemCategories: string;
      customCategories: string;
      anotherCategory: string;
      newCategoryName: string;
      addQuickCategory: string;
      manageCategories: string;
      categoryCreatedAndSelected: string;
      categoryAlreadyExists: string;
      quickCategoryMissing: string;
      viewSelector: string;
      views: {
        all: string;
        unlocated: string;
        archived: string;
      };
      itemTypes: {
        unique: string;
        stock: string;
        set: string;
      };
      errors: {
        actionFailed: string;
        adminRequired: string;
        invalidCategory: string;
        invalidItemType: string;
        invalidLocation: string;
        invalidQuantity: string;
        itemNotFound: string;
        missingFields: string;
        unknown: string;
      };
      feedback: {
        itemCreated: string;
        itemUpdated: string;
        itemArchived: string;
      };
      search: string;
      searchPlaceholder: string;
      category: string;
      room: string;
      storage: string;
      position: string;
      status: string;
      sort: string;
      filter: string;
      clearFilters: string;
      allCategories: string;
      allRooms: string;
      allStorageLocations: string;
      allPositions: string;
      allStatuses: string;
      empty: string;
      emptyUnlocated: string;
      emptyArchived: string;
      noResults: string;
      location: string;
      noLocation: string;
      locationCode: string;
      addedOn: string;
      sortOptions: {
        recent: string;
        name: string;
        category: string;
        location: string;
      };
      statuses: {
        atHome: string;
        consumed: string;
        borrowed: string;
        archived: string;
      };
    };
    home: {
      title: string;
      subtitle: string;
      household: string;
      saveChanges: string;
      generatedCode: string;
      readOnly: string;
      empty: string;
      noLocations: string;
      noPositions: string;
      search: {
        label: string;
        placeholder: string;
        scope: string;
        clear: string;
        submit: string;
        noResults: string;
        scopes: {
          all: string;
          rooms: string;
          storage: string;
          positions: string;
        };
      };
      entityActions: {
        add: string;
        create: string;
        delete: string;
        edit: string;
      };
      entityLabels: {
        room: {
          singular: string;
          plural: string;
        };
        storage: {
          singular: string;
          plural: string;
        };
        position: {
          singular: string;
          plural: string;
        };
      };
      fields: {
        description: string;
        icon: string;
        locationCode: string;
        name: string;
        order: string;
        type: string;
        customRoomType: string;
        customStorageType: string;
        typeHelp: string;
        typePlaceholder: string;
      };
      roomTypeSuggestions: string[];
      storageTypeSuggestions: string[];
      errors: {
        actionFailed: string;
        adminRequired: string;
        duplicateLocation: string;
        duplicatePosition: string;
        duplicateRoom: string;
        invalidOrder: string;
        locationNotEmpty: string;
        missingFields: string;
        positionInUse: string;
        roomNotEmpty: string;
        unknown: string;
      };
      statuses: {
        locationCreated: string;
        locationDeleted: string;
        locationUpdated: string;
        positionCreated: string;
        positionDeleted: string;
        positionUpdated: string;
        roomCreated: string;
        roomDeleted: string;
        roomUpdated: string;
      };
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
      addCategory: string;
      createCategory: string;
      editCategory: string;
      deleteCategory: string;
      saveChanges: string;
      readOnly: string;
      fields: {
        name: string;
        customName: string;
        nameHelp: string;
      };
      errors: {
        actionFailed: string;
        adminRequired: string;
        categoryInUse: string;
        missingFields: string;
        unknown: string;
      };
      statuses: {
        categoryAvailable: string;
        categoryCreated: string;
        categoryDeleted: string;
        categoryExists: string;
        categoryUpdated: string;
      };
    };
    settings: {
      title: string;
      household: string;
      account: string;
      export: string;
    };
  };
};
