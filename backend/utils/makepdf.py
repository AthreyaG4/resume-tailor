from jinja2 import Environment, FileSystemLoader
import subprocess
import tempfile
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def make_pdf(tailored_resume) -> bytes:
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
        loader=FileSystemLoader(os.path.join(BASE_DIR, "templates")),
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

    template = env.get_template("resume.tex")
    output = template.render(**tailored_resume.model_dump())

    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, "resume.tex")
        pdf_path = os.path.join(tmpdir, "resume.pdf")

        with open(tex_path, "w") as f:
            f.write(output)

        # subprocess.run(
        #     [
        #         "pdflatex",
        #         "-interaction=nonstopmode",
        #         "-output-directory",
        #         tmpdir,
        #         tex_path,
        #     ],
        #     check=True,
        #     capture_output=True,
        # )

        result = subprocess.run(
            [
                "pdflatex",
                "-interaction=nonstopmode",
                "-output-directory",
                tmpdir,
                tex_path,
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            raise subprocess.CalledProcessError(result.returncode, result.args)

        with open(pdf_path, "rb") as f:
            return f.read()
