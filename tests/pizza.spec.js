import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test("diner page logged in", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 3,
        name: "Test User",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "TU" }).click();
  await expect(page.getByText("Your pizza kitchen")).toBeVisible();
  await expect(page.getByText("Test")).toBeVisible();
  await expect(page.getByText("d@jwt.com")).toBeVisible();
  await expect(page.getByText("diner", { exact: true })).toBeVisible();
});

test("diner page not logged in", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page
    .getByLabel("Global")
    .getByRole("link", { name: "Franchise" })
    .click();
  await page.getByRole("link", { name: "Order" }).click();
  await page.goto("http://localhost:5173/menu");
});

test("login test", async ({ page }) => {
  await page.goto("http://localhost:5173/");

  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 3,
        name: "Test User",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
});

test("logout test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 3,
        name: "Test User",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };

    const logoutRes = { message: "logout successful", status: 200 };
    if (route.request().method() === "PUT") {
      expect(route.request().method()).toBe("PUT");
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    }
    if (route.request().method() === "DELETE") {
      expect(route.request().method()).toBe("DELETE");
      expect(route.request().headers()["authorization"]).toBe("Bearer abcdef");
      await route.fulfill({ json: logoutRes, status: 200 });
    }
  });
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
  //await expect(page.getByRole("link", { name: "TU" })).toBeVisible();
  await page.getByRole("link", { name: "Logout" }).click();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
});

test("register test", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.route("*/**/api/auth", async (route) => {
    const registerReq = {
      name: "Test User",
      email: "l@jwt.com",
      password: "admin",
    };
    const registerRes = {
      user: {
        id: 3,
        name: "Test User",
        email: "d@jwt.com",
        roles: [{ role: "diner" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(registerReq);
    await route.fulfill({ json: registerRes });
  });

  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Test User");
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();
  await expect(page.getByRole("link", { name: "TU" })).toBeVisible();
});

test("login admin", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 1,
        name: "Test Admin",
        email: "l@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
});

test("create franchise", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 1,
        name: "Test Admin",
        email: "l@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/franchise", async (route) => {
    const franchiseReq = {
      name: "Test Pizza",
      admins: [
        {
          email: "l@jwt.com",
        },
      ],
    };
    const franchiseRes = {
      name: "Test Pizza",
      admins: [
        {
          email: "l@jwt.com",
          id: 1,
          name: "pizza franchise",
        },
      ],
      id: 1,
    };
    if (route.request().method() === "GET") {
      const listRes = [
        {
          id: 1,
          name: "Sequel Pizza",
          admins: [{ id: 4, name: "pizza franchisee", email: "f@jwt.com" }],
          stores: [{ id: 1, name: "SLC", totalRevenue: 0 }],
        },
        {
          name: "Test Pizza",
          admins: [{ id: 1, name: "pizza franchisee", email: "l@jwt.com" }],
          stores: [{ id: 1, name: "Dulop", totalRevenue: 0 }],
        },
      ];

      await route.fulfill({ json: listRes });
    }
    if (route.request().method() === "POST") {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      await route.fulfill({ json: franchiseRes });
    }
  });

  await page.goto("http://localhost:5173/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button").filter({ hasText: /^$/ }).click();
  await page.getByRole("button").filter({ hasText: /^$/ }).click();
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page.getByRole("textbox", { name: "franchise name" }).click();
  await page
    .getByRole("textbox", { name: "franchise name" })
    .fill("Test Pizza");
  await page.getByRole("textbox", { name: "franchisee admin email" }).click();
  await page
    .getByRole("textbox", { name: "franchisee admin email" })
    .fill("l@jwt.com");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("cell", { name: "Test Pizza" })).toBeVisible();
});

test("admin deletes franchise", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 1,
        name: "Test Admin",
        email: "l@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  await page.route("*/**/api/franchise", async (route) => {
    const listRes = [
      {
        id: 1,
        name: "Sequel Pizza",
        admins: [{ id: 4, name: "pizza franchisee", email: "f@jwt.com" }],
        stores: [{ id: 1, name: "SLC", totalRevenue: 0 }],
      },
      {
        name: "Test Pizza",
        admins: [{ id: 1, name: "pizza franchisee", email: "l@jwt.com" }],
        stores: [{ id: 1, name: "Dulop", totalRevenue: 0 }],
      },
    ];
    await expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: listRes });
  });
  await page.goto("http://localhost:5173/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  await page
    .getByRole("row", { name: "Test Pizza pizza franchisee" })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(
    page.getByRole("cell", { name: "Test Pizza" })
  ).not.toBeVisible();
});

test("create store", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 1,
        name: "Test Admin",
        email: "l@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/franchise", async (route) => {
    const franchiseReq = {
      name: "Test Pizza",
      admins: [
        {
          email: "l@jwt.com",
        },
      ],
    };
    const franchiseRes = {
      name: "Test Pizza",
      admins: [
        {
          email: "l@jwt.com",
          id: 1,
          name: "pizza franchise",
        },
      ],
      id: 1,
    };
    if (route.request().method() === "GET") {
      const listRes = [
        {
          id: 1,
          name: "Sequel Pizza",
          admins: [{ id: 4, name: "pizza franchisee", email: "l@jwt.com" }],
          stores: [{ id: 1, name: "SLC", totalRevenue: 0 }],
        },
        {
          id: 1,
          name: "Test Pizza",
          admins: [{ id: 1, name: "pizza franchisee", email: "l@jwt.com" }],
          stores: [{ id: 1, name: "Dulop", totalRevenue: 0 }],
        },
      ];

      await route.fulfill({ json: listRes });
    }
    if (route.request().method() === "POST") {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      await route.fulfill({ json: franchiseRes });
    }
  });
  await page.route("*/**/api/franchise/1/store", async (route) => {
    const storeReq = {
      name: "Dulop",
      id: "",
    };
    const storeRes = {
      name: "Dulop",
      id: 1,
      totalRevenue: 0,
    };

    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(storeReq);
    await route.fulfill({ json: storeRes });
  });
  await page.route("*/**/api/franchise/1", async (route) => {
    const listRes = [
      {
        id: 1,
        name: "Test Pizza",
        admins: [{ id: 1, name: "pizza franchisee", email: "l@jwt.com" }],
        stores: [{ id: 1, name: "Dulop", totalRevenue: 0 }],
      },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: listRes });
  });
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  await page.getByRole("button", { name: "Add Franchise" }).click();
  await page.getByRole("textbox", { name: "franchise name" }).click();
  await page
    .getByRole("textbox", { name: "franchise name" })
    .fill("Test Pizza");
  await page.getByRole("textbox", { name: "franchisee admin email" }).click();
  await page
    .getByRole("textbox", { name: "franchisee admin email" })
    .fill("l@jwt.com");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Franchise", exact: true }).click();
  await page.getByRole("button", { name: "Create store" }).click();
  await page.getByRole("textbox", { name: "store name" }).click();
  await page.getByRole("textbox", { name: "store name" }).fill("Dulop");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("cell", { name: "Dulop" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "₿" })).toBeVisible();
});

test("delete store", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  let interval = 0;
  let interval2 = 0;
  await page.route("*/**/api/auth", async (route) => {
    const loginReq = { email: "l@jwt.com", password: "admin" };
    const loginRes = {
      user: {
        id: 1,
        name: "Test Admin",
        email: "l@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/franchise", async (route) => {
    const franchiseReq = {
      name: "Test Pizza",
      admins: [
        {
          email: "l@jwt.com",
        },
      ],
    };
    const franchiseRes = {
      name: "Test Pizza",
      admins: [
        {
          email: "l@jwt.com",
          id: 1,
          name: "pizza franchise",
        },
      ],
      id: 1,
    };
    if (route.request().method() === "GET") {
      const listRes1 = [
        {
          id: 1,
          name: "Sequel Pizza",
          admins: [{ id: 4, name: "pizza franchisee", email: "l@jwt.com" }],
          stores: [{ id: 1, name: "SLC", totalRevenue: 0 }],
        },
        {
          id: 1,
          name: "Test Pizza",
          admins: [{ id: 1, name: "pizza franchisee", email: "l@jwt.com" }],
          stores: [{ id: 1, name: "Dulop", totalRevenue: 0 }],
        },
      ];
      const listRes2 = [
        {
          id: 1,
          name: "Sequel Pizza",
          admins: [{ id: 4, name: "pizza franchisee", email: "l@jwt.com" }],
          stores: [{ id: 1, name: "SLC", totalRevenue: 0 }],
        },
      ];

      if (interval2 === 0) {
        await route.fulfill({ json: listRes1 });
      } else {
        await route.fulfill({ json: listRes2 });
      }
      interval2 += 1;
    }
    if (route.request().method() === "POST") {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toMatchObject(franchiseReq);
      await route.fulfill({ json: franchiseRes });
    }
  });
  await page.route("*/**/api/franchise/1/store", async (route) => {
    const storeReq = {
      name: "Dulop",
      id: "",
    };
    const storeRes = {
      name: "Dulop",
      id: 1,
      totalRevenue: 0,
    };

    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(storeReq);
    await route.fulfill({ json: storeRes });
  });
  await page.route("*/**/api/franchise/1", async (route) => {
    const listRes1 = [
      {
        id: 1,
        name: "Test Pizza",
        admins: [{ id: 1, name: "pizza franchisee", email: "l@jwt.com" }],
        stores: [{ id: 1, name: "Dulop", totalRevenue: 0 }],
      },
    ];
    const listRes2 = [
      {
        id: 1,
        name: "Test Pizza",
        admins: [{ id: 1, name: "pizza franchisee", email: "l@jwt.com" }],
        stores: [],
      },
    ];
    expect(route.request().method()).toBe("GET");
    if (interval === 0) {
      await route.fulfill({ json: listRes1 });
    } else {
      await route.fulfill({ json: listRes2 });
    }
    interval += 1;
  });
  await page.route("*/**/api/franchise/1/store/1", async (route) => {
    const deleteRes = { message: "store deleted", status: 200 };
    await route.fulfill({ json: deleteRes });
  });
  await page.goto("http://localhost:5173/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("l@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("link", { name: "Admin" }).click();
  await page
    .getByRole("row", { name: "Dulop 0 ₿ Close" })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("cell", { name: "Dulop" })).not.toBeVisible();
});