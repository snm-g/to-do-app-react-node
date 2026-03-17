export const taskDecorator = (task) => {
  return {
    id: task.id,
    title: task.title,
    description: task.description || "",
    isCompleted: !!task.is_completed,
    userId: task.user_id,
    categoryId: task.category_id,
  };
};

export const tasksListDecorator = (tasks) => {
  return tasks.map(taskDecorator);
};
