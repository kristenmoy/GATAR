export async function POST(req: Request)
{
  const data = await req.formData();
  const file = data.get("file") as File;

  if (!file || file.type !== "application/pdf")
  {
    return new Response(
      JSON.stringify({ error: "Only PDFs allowed" }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  return new Response(
    JSON.stringify({ message: "File uploaded successfully" }),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
