import type { TodoLists } from "../../domain/TodoLists";
import type { TodoListPermissions } from "../../domain/TodoListPermissions";
import { UpdateTodoListTitle } from "../../usecase/UpdateTodoListTitle";
import { TodoListsInMemory } from "./fakes/TodoListsInMemory";
import { TodoListPermissionsInMemory } from "./fakes/TodoListPermissionsInMemory";
import { aTodoList, TodoListBuilder } from "./builders/TodoList";
import {
  aTodoListPermission,
  TodoListPermissionBuilder,
} from "./builders/TodoListPermission";
import { TodoListPermissionDeniedError } from "../../domain/TodoListPermissionDeniedError";

let todoLists: TodoLists;
let todoListPermissions: TodoListPermissions;
let updateTodoListTitle: UpdateTodoListTitle;

beforeEach(() => {
  todoLists = new TodoListsInMemory();
  todoListPermissions = new TodoListPermissionsInMemory();
  updateTodoListTitle = new UpdateTodoListTitle(todoLists, todoListPermissions);
});

it("renaming a todo list requires permission", async () => {
  await givenPermission(
    aTodoListPermission().forTodoList("todoList/1").forOwner("owner/1")
  );

  await expect(
    updateTodoListTitle.execute("todoList/1", "Updated title", "contributor/1")
  ).rejects.toEqual(
    new TodoListPermissionDeniedError("todoList/1", "contributor/1")
  );
});

const AUTHORIZED_CASES = [
  {
    role: "authorized contributor",
    todoListId: "todoList/1",
    contributorId: "contributor/authorized",
    permission: aTodoListPermission()
      .forTodoList("todoList/1")
      .withContributors("contributor/authorized"),
  },
  {
    role: "owner",
    todoListId: "todoList/2",
    contributorId: "contributor/owner",
    permission: aTodoListPermission()
      .forTodoList("todoList/2")
      .forOwner("contributor/owner"),
  },
];

AUTHORIZED_CASES.forEach(({ role, todoListId, contributorId, permission }) =>
  it(`renames the todo list (role=${role})`, async () => {
    await Promise.all([
      givenPermission(permission),
      givenTodoList(aTodoList().withId(todoListId).withTitle("Current title")),
    ]);

    await updateTodoListTitle.execute(
      todoListId,
      "Updated title",
      contributorId
    );

    expect((await todoLists.ofId(todoListId)).title).toEqual("Updated title");
  })
);

function givenPermission(todoListPermission: TodoListPermissionBuilder) {
  return todoListPermissions.save(todoListPermission.build());
}

function givenTodoList(todoList: TodoListBuilder) {
  return todoLists.save(todoList.build());
}