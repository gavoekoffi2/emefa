// Copyright 2026 EMEFA (progenius.ai). All rights reserved.
// Licensed under the Apache License, Version 2.0.

package ai.progenius.emefa.tool

data class ToolParameter(
    val name: String,
    val type: String,
    val description: String,
    val isRequired: Boolean
)
