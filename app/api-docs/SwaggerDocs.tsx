'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

import spec from '@/docs/openapi.json'

export function SwaggerDocs() {
  return (
    <div className="gf-swagger-shell">
      <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={1} />
    </div>
  )
}
