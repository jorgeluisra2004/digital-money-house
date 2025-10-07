// e2e/utils/mockApi.ts
import { Page } from "@playwright/test";

/**
 * Fija la hora del runtime del browser a un instante estable.
 * Evita problemas con constructores de clases derivadas (usa super(...)).
 */
export async function freezeTime(
  page: Page,
  iso = "2022-08-17T16:34:00-03:00"
) {
  await page.addInitScript(
    ({ ts }) => {
      const OriginalDate = Date as unknown as typeof Date;
      const fixedMs = new OriginalDate(ts).getTime();

      class FixedDate extends OriginalDate {
        constructor(...args: any[]) {
          // Sin argumentos => devolver la fecha fija
          if (args.length === 0) {
            super(fixedMs);
            return;
          }
          // Con argumentos => delegar explícitamente (evita alerta del spread)
          switch (args.length) {
            case 1:
              super(args[0]);
              break;
            case 2:
              super(args[0], args[1]);
              break;
            case 3:
              super(args[0], args[1], args[2]);
              break;
            case 4:
              super(args[0], args[1], args[2], args[3]);
              break;
            case 5:
              super(args[0], args[1], args[2], args[3], args[4]);
              break;
            case 6:
              super(args[0], args[1], args[2], args[3], args[4], args[5]);
              break;
            default:
              super(
                args[0],
                args[1],
                args[2],
                args[3],
                args[4],
                args[5],
                args[6]
              );
          }
        }
        static now() {
          return fixedMs;
        }
      }

      // Reemplazamos Date global (mantiene prototipo)
      // @ts-expect-error Asignación intencional al global
      window.Date = FixedDate;
    },
    { ts: iso }
  );
}

export async function stubSupabaseActividad(page: Page) {
  // movimientos
  await page.route(/\/rest\/v1\/movimientos/i, (route) => {
    const data = [
      {
        id: 1,
        usuario_id: "e2e-user",
        fecha: "2022-08-13T10:00:00-03:00",
        monto: -1265.57,
        descripcion: "Transferiste a Rodrigo",
      },
      {
        id: 2,
        usuario_id: "e2e-user",
        fecha: "2022-08-06T10:00:00-03:00",
        monto: -1265.57,
        descripcion: "Transferiste a Consorcio",
      },
      {
        id: 3,
        usuario_id: "e2e-user",
        fecha: "2022-08-06T12:00:00-03:00",
        monto: 1265.57,
        descripcion: "Ingresaste dinero",
      },
      {
        id: 4,
        usuario_id: "e2e-user",
        fecha: "2022-08-06T14:00:00-03:00",
        monto: 1265.57,
        descripcion: "Te transfirieron dinero",
      },
    ];
    route.fulfill({ status: 200, json: data });
  });
}

/**
 * Stub específico para el flujo de "Cargar dinero"
 */
export async function stubSupabaseCarga(page: Page) {
  // tarjetas
  await page.route(/\/rest\/v1\/tarjetas/i, (route) =>
    route.fulfill({
      status: 200,
      json: [
        { id: "1", brand: "Visa", last4: "0000" },
        { id: "2", brand: "Mastercard", last4: "4067" },
      ],
    })
  );

  // cuenta
  await page.route(/\/rest\/v1\/cuentas/i, (route) =>
    route.fulfill({
      status: 200,
      json: [
        {
          id: 99,
          usuario_id: "e2e-user",
          saldo: 1500,
          cvu: "0000002100075990000000",
          alias: "estealiasnoexiste",
        },
      ],
    })
  );

  // rpc cargar dinero
  await page.route(/\/rpc\/fn_cargar_dinero/i, (route) =>
    route.fulfill({ status: 200, json: 1800 })
  );
}

/**
 * Stub genérico de cuentas + tarjetas para flujos de "Pagar servicios".
 * Permite configurar el saldo y el set de tarjetas.
 */
export async function stubSupabaseCuentasTarjetas(
  page: Page,
  opts?: {
    saldo?: number;
    tarjetas?: Array<{ id: string; brand: string; last4: string }>;
  }
) {
  const saldo = opts?.saldo ?? 300000;
  const tarjetas = opts?.tarjetas ?? [
    { id: "stub-1", brand: "Visa", last4: "4067" },
    { id: "stub-2", brand: "Mastercard", last4: "8040" },
    { id: "stub-3", brand: "Visa", last4: "9006" },
  ];

  // cuentas (GET/POST)
  await page.route(/\/rest\/v1\/cuentas/i, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      return route.fulfill({
        status: 200,
        json: [
          {
            id: "acc-1",
            usuario_id: "e2e-user",
            saldo,
            cvu: "",
            alias: "",
          },
        ],
      });
    }
    if (method === "POST") {
      return route.fulfill({
        status: 201,
        json: [
          {
            id: "acc-1",
            usuario_id: "e2e-user",
            saldo: 0,
            cvu: "",
            alias: "",
          },
        ],
      });
    }
    return route.continue();
  });

  // tarjetas (GET)
  await page.route(/\/rest\/v1\/tarjetas/i, async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        json: tarjetas,
      });
    }
    return route.continue();
  });

  // Evita errores para cualquier RPC que se dispare de fondo
  await page.route(/\/rest\/v1\/rpc\/.*/i, async (route) => {
    return route.fulfill({ status: 200, json: [] });
  });
}
