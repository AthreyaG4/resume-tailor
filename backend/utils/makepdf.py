from jinja2 import Environment, FileSystemLoader
import subprocess
import tempfile
import os


def make_pdf(tailored_resume):
    def latex_escape(text):
        if not isinstance(text, str):
            return text
        return (
            text.replace("&", "\\&")
            .replace("%", "\\%")
            .replace("$", "\\$")
            .replace("#", "\\#")
            .replace("_", "\\_")
        )

    env = Environment(
        loader=FileSystemLoader("."),
        block_start_string="((*",
        block_end_string="*))",
        variable_start_string="(((",
        variable_end_string=")))",
        comment_start_string="((#",
        comment_end_string="#))",
        finalize=latex_escape,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    template = env.get_template("../templates/resume.tex")
    output = template.render(**tailored_resume.model_dump())

    def render_to_pdf(latex_content: str) -> bytes:
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_path = os.path.join(tmpdir, "resume.tex")
            pdf_path = os.path.join(tmpdir, "resume.pdf")

            with open(tex_path, "w") as f:
                f.write(latex_content)

            subprocess.run(
                [
                    "pdflatex",
                    "-interaction=nonstopmode",
                    "-output-directory",
                    tmpdir,
                    tex_path,
                ],
                check=True,
                capture_output=True,
            )

            with open(pdf_path, "rb") as f:
                return f.read()

    pdf_bytes = render_to_pdf(output)

    with open("resume.pdf", "wb") as f:
        f.write(pdf_bytes)

    # save to s3 maybe here or return bytes and save in route handler
    return pdf_bytes
