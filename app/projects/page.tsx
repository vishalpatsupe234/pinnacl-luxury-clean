import { permanentRedirect } from "next/navigation";

// /properties is now the canonical public property inventory route.
// /projects is kept only as a redirect (not deleted outright) so
// existing links/bookmarks/search results still resolve somewhere
// correct, without serving duplicate content at two URLs.
export default function ProjectsPage(): never {
  permanentRedirect("/properties");
}
