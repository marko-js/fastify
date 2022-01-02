import snap from "mocha-snap";
import fastify from "fastify";
import markoPlugin from "../index";
import SimpleTemplate from "./fixtures/simple.marko";
import DynamicTemplate from "./fixtures/dynamic.marko";
import GlobalsTemplate from "./fixtures/globals.marko";
import ErrorTemplate from "./fixtures/error.marko";

it("Simple Template", async () => {
  const res = await fastify()
    .register(markoPlugin)
    .get("/", async (_, reply) => await reply.marko(SimpleTemplate))
    .inject()
    .get("/");

  await snap.inline(res.statusCode, `200`);
  await snap.inline(res.headers["content-type"], `text/html; charset=utf-8`);
  await snap.inline(res.headers["transfer-encoding"], `chunked`);
  await snap.inline(res.body, `<div>Hello world</div>`);
});

it("Dynamic Template", async () => {
  const res = await fastify()
    .register(markoPlugin)
    .get(
      "/",
      async (_, reply) => await reply.marko(DynamicTemplate, { name: "Dylan" })
    )
    .inject()
    .get("/");

  await snap.inline(res.statusCode, `200`);
  await snap.inline(res.headers["content-type"], `text/html; charset=utf-8`);
  await snap.inline(res.headers["transfer-encoding"], `chunked`);
  await snap.inline(res.body, `<div>Hello Dylan</div>`);
});

it("Globals Template", async () => {
  const res = await fastify()
    .register(markoPlugin)
    .get("/", async (_, reply) => {
      reply.locals.greeting = "Goodbye";
      await reply.marko(GlobalsTemplate, { $global: { name: "Michael" } });
    })
    .inject()
    .get("/");

  await snap.inline(res.statusCode, `200`);
  await snap.inline(res.headers["content-type"], `text/html; charset=utf-8`);
  await snap.inline(res.headers["transfer-encoding"], `chunked`);
  await snap.inline(res.body, `<div>Goodbye Michael</div>`);
});

it("Error In Template", async () => {
  const res = await fastify()
    .register(markoPlugin)
    .get("/", async (_, reply) => await reply.marko(ErrorTemplate))
    .inject()
    .get("/");

  await snap.inline(res.statusCode, `500`);
  await snap.inline(
    res.body,
    `{"statusCode":500,"error":"Internal Server Error","message":"fail\\nRendered by Promise.resolve()"}`
  );
});
