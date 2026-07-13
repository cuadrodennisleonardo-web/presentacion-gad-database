import { Helmet, HelmetProvider } from "react-helmet-async";

export const AppWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <HelmetProvider>{children}</HelmetProvider>;
};

interface PageMetaProps {
  title: string;
  description?: string;
}

const PageMeta: React.FC<PageMetaProps> = ({ title, description }) => (
  <Helmet>
    <title>{title} | Presentacion Municipal Database</title>
    {description && <meta name="description" content={description} />}
  </Helmet>
);

export default PageMeta;
