import Fastify, { FastifyInstance } from "fastify";
import fetch from "node-fetch";
import markoPlugin from "../index";
import SimpleTemplate from "./fixtures/simple.marko";
import DynamicTemplate from "./fixtures/dynamic.marko";
import GlobalsTemplate from "./fixtures/globals.marko";
import ErrorTemplate from "./fixtures/error.marko";

test("Simple Template", async () => {
  const { res, html } = await fetchHtml(
    createApp().get("/", async (req, res) => {
      await res.marko(SimpleTemplate);
    })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(res.headers.get("content-type")).toMatchInlineSnapshot(
    `"text/html; charset=utf-8"`
  );
  expect(res.headers.get("transfer-encoding")).toMatchInlineSnapshot(
    `"chunked"`
  );
  expect(html).toMatchInlineSnapshot(`"<div>Hello world</div>"`);
});

test("Dynamic Template", async () => {
  const { res, html } = await fetchHtml(
    createApp().get("/", async (req, res) => {
      await res.marko(DynamicTemplate, { name: "Dylan" });
    })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(res.headers.get("content-type")).toMatchInlineSnapshot(
    `"text/html; charset=utf-8"`
  );
  expect(res.headers.get("transfer-encoding")).toMatchInlineSnapshot(
    `"chunked"`
  );
  expect(html).toMatchInlineSnapshot(`"<div>Hello Dylan</div>"`);
});

test("Globals Template", async () => {
  const { res, html } = await fetchHtml(
    createApp().get("/", async (req, res) => {
      res.locals.greeting = "Goodbye";
      await res.marko(GlobalsTemplate, { $global: { name: "Michael" } });
    })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(res.headers.get("content-type")).toMatchInlineSnapshot(
    `"text/html; charset=utf-8"`
  );
  expect(res.headers.get("transfer-encoding")).toMatchInlineSnapshot(
    `"chunked"`
  );
  expect(html).toMatchInlineSnapshot(`"<div>Goodbye Michael</div>"`);
});

test("Error In Template", async () => {
  const { res, html } = await fetchHtml(
    createApp()
      .get("/", async (req, res) => {
        await res.marko(ErrorTemplate);
      })
      .addHook("onError", async (req, res, err) => {
        expect(err.message).toMatchInlineSnapshot(`
          "fail
          Rendered by Promise.resolve()"
        `);
      })
  );

  expect(res.status).toMatchInlineSnapshot(`500`);
  expect(html).toMatchInlineSnapshot(
    `"{\\"statusCode\\":500,\\"error\\":\\"Internal Server Error\\",\\"message\\":\\"fail\\\\nRendered by Promise.resolve()\\"}"`
  );
});

async function fetchHtml(app: FastifyInstance) {
  const res = await fetch(await app.listen(0));
  const html = await res.text();
  await app.close();
  return { res, html };
}

function createApp() {
  return Fastify().register(markoPlugin);
}
