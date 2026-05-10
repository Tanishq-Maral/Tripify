// Declare CSS file imports so TypeScript doesn't error on them
declare module "*.css";

// Declare static asset imports
declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.jpeg" {
  const src: string;
  export default src;
}
declare module "*.gif" {
  const src: string;
  export default src;
}
declare module "*.webp" {
  const src: string;
  export default src;
}

// Allow importing text/pdf files as URLs
declare module "*.txt" {
  const src: string;
  export default src;
}
declare module "*.pdf" {
  const src: string;
  export default src;
}
