const fragmentSrc = `
    #version 300 es
    precision mediump float;

    uniform vec3 uViewPos;

    struct Material {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        float shininess;
    };

    struct Light {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec3 position;
    };

    uniform Material material;
    uniform Light light;

    in vec3 vNormal;
    in vec3 vFragPos;

    out vec4 fragColor;

    void main() {

        vec3 lightDir = normalize(light.position - vFragPos);
        vec3 viewDir = normalize(uViewPos - vFragPos);
        vec3 normal = normalize(vNormal);
        vec3 reflectDir = normalize(reflect(-lightDir, normal));

        float diff = max(dot(lightDir, normal), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);
        // float spec = pow(max(dot(normalize(-lightDir + viewDir), normal), 0.0), material.shininess);

        vec3 ambient = light.ambient * material.ambient;
        vec3 diffuse = light.diffuse * material.diffuse * diff;
        vec3 specular = light.specular * material.specular * spec;
        fragColor = vec4(ambient + diffuse + specular, 1.0);
    }
`.trim();

export default fragmentSrc;