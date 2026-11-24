declare module '@svg-maps/usa' {
  const usa: {
    viewBox: string;
    locations: Array<{
      id: string;
      name: string;
      path: string;
    }>;
  };

  export default usa;
}