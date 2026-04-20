import type { NodeTypes } from '@xyflow/react';
import {
  ApprovalNode,
  AutomatedNode,
  EndNode,
  StartNode,
  TaskNode,
} from './nodeTypes';

export const nodeTypes: NodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated: AutomatedNode,
  end: EndNode,
};
