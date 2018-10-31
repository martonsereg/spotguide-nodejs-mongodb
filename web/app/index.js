'use strict'

const { middleware } = require('@banzaicloud/service-tools')
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const Prometheus = require('../models/Prometheus')
const routes = require('./routes')

const app = new Koa()

// register middleware
app.use(async (ctx, next) => {
  if (ctx.path === '/metrics') {
    await next()
    return
  }

  const start = Date.now()

  Prometheus.httpRequestInFlight.inc()
  try {
    await next()
  } finally {
    Prometheus.httpRequestInFlight.dec()

    const responseTimeInMs = Date.now() - start
    Prometheus.httpRequestDurationMicroseconds.labels(ctx.method, ctx.path, ctx.status).observe(responseTimeInMs)
  }
})
app.use(middleware.koa.errorHandler())
app.use(middleware.koa.requestLogger())
app.use(bodyParser())
app.use(routes)

module.exports = app
