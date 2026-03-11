export const categoryDecorator = (category) => {
  return {
    id: category.id,
    name: category.name,
  };
};

export const categoriesListDecorator = (categories) => {
  return categories.map(categoryDecorator);
};
