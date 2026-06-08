import {
  GraphQLError,
  Kind,
  type ASTNode,
  type FieldNode,
  type FragmentDefinitionNode,
  type InlineFragmentNode,
  type ValidationRule,
  NoSchemaIntrospectionCustomRule,
} from "graphql";

const DEFAULT_MAX_DEPTH = 10;

function getMaxDepth(): number {
  const parsed = parseInt(process.env.GRAPHQL_MAX_DEPTH || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_DEPTH;
}

function collectFragments(
  document: ASTNode & { definitions: readonly ASTNode[] }
): Record<string, FragmentDefinitionNode> {
  const fragments: Record<string, FragmentDefinitionNode> = {};
  for (const definition of document.definitions) {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments[definition.name.value] = definition;
    }
  }
  return fragments;
}

function measureDepth(
  node: FieldNode | InlineFragmentNode | FragmentDefinitionNode,
  fragments: Record<string, FragmentDefinitionNode>,
  seenFragments: Set<string>,
  depth: number,
  maxDepth: number,
  report: (node: ASTNode) => void
): void {
  if (depth > maxDepth) {
    report(node);
    return;
  }

  const selections = node.selectionSet?.selections ?? [];
  for (const selection of selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        const field = selection as FieldNode;
        if (field.name.value === "__typename" || !field.selectionSet) continue;
        measureDepth(field, fragments, seenFragments, depth + 1, maxDepth, report);
        break;
      }
      case Kind.INLINE_FRAGMENT:
        measureDepth(
          selection as InlineFragmentNode,
          fragments,
          seenFragments,
          depth + 1,
          maxDepth,
          report
        );
        break;
      case Kind.FRAGMENT_SPREAD: {
        const spreadName = selection.name.value;
        if (seenFragments.has(spreadName)) continue;
        const fragment = fragments[spreadName];
        if (!fragment) continue;
        const nextSeen = new Set(seenFragments);
        nextSeen.add(spreadName);
        measureDepth(fragment, fragments, nextSeen, depth + 1, maxDepth, report);
        break;
      }
    }
  }
}

export function createDepthLimitRule(maxDepth = getMaxDepth()): ValidationRule {
  return (context) => {
    const fragments = collectFragments(context.getDocument());

    return {
      Document(node) {
        for (const definition of node.definitions) {
          if (definition.kind !== Kind.OPERATION_DEFINITION) continue;
          const selections = definition.selectionSet?.selections ?? [];
          for (const selection of selections) {
            if (selection.kind === Kind.FIELD && selection.selectionSet) {
              measureDepth(
                selection,
                fragments,
                new Set(),
                1,
                maxDepth,
                (errorNode) => {
                  context.reportError(
                    new GraphQLError(
                      `Query exceeds maximum depth of ${maxDepth}`,
                      { nodes: [errorNode] }
                    )
                  );
                }
              );
            }
          }
        }
      },
    };
  };
}

export function getGraphQLValidationRules(): ValidationRule[] {
  const rules: ValidationRule[] = [createDepthLimitRule()];
  if (process.env.NODE_ENV === "production") {
    rules.push(NoSchemaIntrospectionCustomRule);
  }
  return rules;
}
