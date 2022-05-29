import type { PrismaClient } from "@prisma/client";
import type { TodoListDto } from "shared/client";
import type { TodoListId } from "../domain/TodoList";
import type { TodoListQuery } from "../domain/TodoListQuery";
import { Inject, Injectable } from "@nestjs/common";
import { PRISMA } from "../../keys";

type TodoListRow = {
  id: string;
  title: string;
  createdAt: string;
  todosOrder: string[];
};

type TodoRow<Completion extends boolean> = {
  id: string;
  title: string;
  isComplete: Completion;
  createdAt: string;
  tags: string[];
};

@Injectable()
export class TodoListDatabaseQuery implements TodoListQuery {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async ofTodoList(todoListId: TodoListId): Promise<TodoListDto> {
    const [{ todosOrder, ...todoList }, tags] = await Promise.all([
      this.fetchTodoList(todoListId),
      this.fetchTodoListTags(todoListId),
    ]);
    const [doingTodos, completedTodos] = await Promise.all([
      this.fetchDoingTodos(todoListId),
      this.fetchCompleteTodos(todoListId),
    ]);

    if (!todoList)
      throw new Response(`Todo list "${todoListId}" was not found.`);

    return {
      ...todoList,
      tags,
      doingTodos: this.sortTodos(doingTodos, todosOrder),
      completedTodos: this.sortTodos(completedTodos, todosOrder),
    };
  }

  private fetchTodoList(todoListId: TodoListId) {
    return this.prisma.$queryRaw<TodoListRow[]>`
      SELECT TL.id, TL.title, TL."createdAt", TL."todosOrder"
      FROM "TodoList" TL
      WHERE TL.id = ${todoListId};
    `.then((rows) => rows[0]);
  }

  private fetchDoingTodos(todoListId: TodoListId) {
    return this.prisma.$queryRaw<TodoRow<false>[]>`
      SELECT T.id, T.title, T."isComplete", T."createdAt", T.tags FROM "Todo" T
      WHERE T."isComplete" IS false
      AND T."todoListId" = ${todoListId};
    `;
  }

  private fetchCompleteTodos(todoListId: TodoListId) {
    return this.prisma.$queryRaw<TodoRow<true>[]>`
      SELECT T.id, T.title, T."isComplete", T."createdAt", T.tags FROM "Todo" T
      WHERE T."isComplete" IS true
      AND T."todoListId" = ${todoListId};
    `;
  }

  private async fetchTodoListTags(todoListId: TodoListId) {
    const rows = await this.prisma.$queryRaw<{ tag: string }[]>`
      SELECT DISTINCT jsonb_array_elements_text(T.tags) AS tag
      FROM "Todo" T
      WHERE T."todoListId" = ${todoListId}
      ORDER BY tag;
    `;

    return rows.map((row) => row.tag);
  }

  private sortTodos<T extends boolean>(todos: TodoRow<T>[], order: string[]) {
    const position = (idToCheck: string) =>
      order.findIndex((id) => idToCheck === id) ?? 0;
    return todos.sort((t1, t2) => position(t1.id) - position(t2.id));
  }
}